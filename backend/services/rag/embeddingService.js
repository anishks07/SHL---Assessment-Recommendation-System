/**
 * Embedding Service for RAG implementation
 * This service handles the creation and management of vector embeddings
 * for the assessment data using OpenAI's embedding API.
 */

import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Constants
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const PINECONE_INDEX_NAME = 'shl-assessments';
const PINECONE_NAMESPACE = 'assessments';

class EmbeddingService {
  constructor() {
    this.index = pinecone.index(PINECONE_INDEX_NAME);
  }

  /**
   * Generate embeddings for a text string
   * @param {string} text - The text to generate embeddings for
   * @returns {Promise<Array<number>>} - The embedding vector
   */
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });
      
      return response.data[0].embedding;
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
   * Index all assessments in the database
   * @param {Array} assessments - Array of assessment objects
   * @returns {Promise<void>}
   */
  async indexAssessments(assessments) {
    try {
      console.log(`Indexing ${assessments.length} assessments...`);
      
      // Process assessments in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < assessments.length; i += batchSize) {
        const batch = assessments.slice(i, i + batchSize);
        const vectors = [];
        
        // Generate embeddings for each assessment in the batch
        for (const assessment of batch) {
          const document = this.createDocument(assessment);
          const embedding = await this.generateEmbedding(document.text);
          
          vectors.push({
            id: document.id,
            values: embedding,
            metadata: document.metadata
          });
        }
        
        // Upsert vectors to Pinecone
        await this.index.upsert({
          vectors,
          namespace: PINECONE_NAMESPACE
        });
        
        console.log(`Indexed batch ${i / batchSize + 1}/${Math.ceil(assessments.length / batchSize)}`);
      }
      
      console.log('Indexing complete!');
    } catch (error) {
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
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Query Pinecone for similar vectors
      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        namespace: PINECONE_NAMESPACE
      });
      
      // Extract and format results
      const results = queryResponse.matches.map(match => ({
        ...match.metadata,
        relevance_score: Math.round(match.score * 100) // Convert similarity score to percentage
      }));
      
      // Filter by time limit
      const filteredResults = results.filter(result => {
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
   * Check if the Pinecone index exists, create it if it doesn't
   * @returns {Promise<void>}
   */
  async ensureIndexExists() {
    try {
      const indexes = await pinecone.listIndexes();
      
      if (!indexes.includes(PINECONE_INDEX_NAME)) {
        console.log(`Creating index ${PINECONE_INDEX_NAME}...`);
        
        await pinecone.createIndex({
          name: PINECONE_INDEX_NAME,
          dimension: 1536, // Dimension of text-embedding-ada-002
          metric: 'cosine'
        });
        
        console.log('Index created successfully!');
      } else {
        console.log(`Index ${PINECONE_INDEX_NAME} already exists.`);
      }
    } catch (error) {
      console.error('Error ensuring index exists:', error);
      throw new Error(`Failed to ensure index exists: ${error.message}`);
    }
  }
}

export default EmbeddingService;
