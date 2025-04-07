/**
 * Free Embedding Service for RAG implementation
 * This service uses TensorFlow.js with Universal Sentence Encoder for embeddings
 * and SQLite for vector storage, providing a completely free alternative.
 */

import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'vectors.db');
const VECTOR_DIMENSION = 512; // Universal Sentence Encoder dimension

class FreeEmbeddingService {
  constructor() {
    this.db = null;
    this.model = null;
    this.initialized = false;
  }

  /**
   * Initialize the embedding service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Initializing free embedding service...');
      
      // Initialize TensorFlow.js
      await tf.ready();
      
      // Load Universal Sentence Encoder model
      console.log('Loading Universal Sentence Encoder model...');
      this.model = await use.load();
      console.log('Model loaded successfully');
      
      // Initialize SQLite database
      console.log('Initializing SQLite database...');
      this.db = new Database(DB_PATH);
      
      // Create tables if they don't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id TEXT PRIMARY KEY,
          vector BLOB,
          metadata TEXT
        )
      `);
      
      // Create custom functions for vector operations
      this.db.function('cosine_similarity', (a, b) => {
        const vecA = new Float32Array(Buffer.from(a).buffer);
        const vecB = new Float32Array(Buffer.from(b).buffer);
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
          dotProduct += vecA[i] * vecB[i];
          normA += vecA[i] * vecA[i];
          normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      });
      
      this.initialized = true;
      console.log('Free embedding service initialized successfully');
    } catch (error) {
      console.error('Error initializing free embedding service:', error);
      throw new Error(`Failed to initialize free embedding service: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for a text string using Universal Sentence Encoder
   * @param {string} text - The text to generate embeddings for
   * @returns {Promise<Float32Array>} - The embedding vector
   */
  async generateEmbedding(text) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Generate embedding using Universal Sentence Encoder
      const embeddings = await this.model.embed([text]);
      const embedding = await embeddings.array();
      
      return embedding[0]; // Return the first (and only) embedding
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Create a document for indexing
   * @param {Object} assessment - The assessment object
   * @returns {Object} - The document for indexing
   */
  createDocument(assessment) {
    // Create a rich text representation of the assessment
    const textRepresentation = `
      Assessment Name: ${assessment.name}
      Test Type: ${assessment.test_type}
      Duration: ${assessment.duration}
      Description: ${assessment.description}
      Remote Testing: ${assessment.remote_testing ? 'Yes' : 'No'}
      Adaptive Support: ${assessment.adaptive_support ? 'Yes' : 'No'}
    `;
    
    return {
      id: assessment.name.replace(/\s+/g, '-').toLowerCase(),
      metadata: {
        name: assessment.name,
        url: assessment.url,
        remote_testing: assessment.remote_testing,
        adaptive_support: assessment.adaptive_support,
        duration: assessment.duration,
        test_type: assessment.test_type,
        description: assessment.description
      },
      text: textRepresentation
    };
  }

  /**
   * Index all assessments in the SQLite database
   * @param {Array} assessments - Array of assessment objects
   * @returns {Promise<void>}
   */
  async indexAssessments(assessments) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      console.log(`Indexing ${assessments.length} assessments...`);
      
      // Begin transaction
      this.db.exec('BEGIN TRANSACTION');
      
      // Prepare insert statement
      const insert = this.db.prepare(`
        INSERT OR REPLACE INTO embeddings (id, vector, metadata)
        VALUES (?, ?, ?)
      `);
      
      // Process assessments in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < assessments.length; i += batchSize) {
        const batch = assessments.slice(i, i + batchSize);
        
        // Generate embeddings for each assessment in the batch
        for (const assessment of batch) {
          const document = this.createDocument(assessment);
          const embedding = await this.generateEmbedding(document.text);
          
          // Insert into database
          insert.run(
            document.id,
            Buffer.from(new Float32Array(embedding).buffer),
            JSON.stringify(document.metadata)
          );
        }
        
        console.log(`Indexed batch ${i / batchSize + 1}/${Math.ceil(assessments.length / batchSize)}`);
      }
      
      // Commit transaction
      this.db.exec('COMMIT');
      
      console.log('Indexing complete!');
    } catch (error) {
      // Rollback transaction on error
      this.db.exec('ROLLBACK');
      
      console.error('Error indexing assessments:', error);
      throw new Error(`Failed to index assessments: ${error.message}`);
    }
  }

  /**
   * Query for similar assessments based on a text query
   * @param {string} query - The query text
   * @param {number} timeLimit - Maximum assessment duration in minutes
   * @param {number} topK - Number of results to return
   * @returns {Promise<Array>} - Array of similar assessments with scores
   */
  async querySimilar(query, timeLimit = 60, topK = 20) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Convert to buffer for SQLite
      const queryVector = Buffer.from(new Float32Array(queryEmbedding).buffer);
      
      // Query SQLite for similar vectors
      const results = this.db.prepare(`
        SELECT id, metadata, cosine_similarity(vector, ?) as similarity
        FROM embeddings
        ORDER BY similarity DESC
        LIMIT ?
      `).all(queryVector, topK);
      
      // Extract and format results
      const formattedResults = results.map(result => {
        const metadata = JSON.parse(result.metadata);
        return {
          ...metadata,
          relevance_score: Math.round(result.similarity * 100) // Convert similarity score to percentage
        };
      });
      
      // Filter by time limit
      const filteredResults = formattedResults.filter(result => {
        const durationMatch = result.duration.match(/(\d+)/);
        if (!durationMatch) return true;
        
        const duration = parseInt(durationMatch[1], 10);
        return duration <= timeLimit;
      });
      
      return filteredResults;
    } catch (error) {
      console.error('Error querying similar assessments:', error);
      throw new Error(`Failed to query similar assessments: ${error.message}`);
    }
  }

  /**
   * Ensure the database exists and is ready to use
   * @returns {Promise<void>}
   */
  async ensureDatabaseExists() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if database directory exists
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      console.log('Database is ready to use');
    } catch (error) {
      console.error('Error ensuring database exists:', error);
      throw new Error(`Failed to ensure database exists: ${error.message}`);
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default FreeEmbeddingService;
