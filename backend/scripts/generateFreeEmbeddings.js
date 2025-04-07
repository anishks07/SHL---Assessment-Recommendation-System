/**
 * Script to generate embeddings for all assessments using free alternatives
 * This script uses TensorFlow.js with Universal Sentence Encoder for embeddings
 * and SQLite for storage, requiring no paid services.
 * 
 * Usage: 
 * 1. Set GEMINI_API_KEY in .env (optional, only used for logging)
 * 2. Run: node scripts/generateFreeEmbeddings.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FreeEmbeddingService from '../services/rag/freeEmbeddingService.js';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize embedding service
const embeddingService = new FreeEmbeddingService();

/**
 * Main function to generate and store embeddings
 */
async function main() {
  try {
    console.log('Starting free embedding generation process...');
    
    // Ensure the database exists
    await embeddingService.ensureDatabaseExists();
    
    // Load assessments from JSON file
    const assessmentsPath = path.join(__dirname, '..', 'data', 'assessments.json');
    const assessments = JSON.parse(fs.readFileSync(assessmentsPath, 'utf8'));
    
    console.log(`Loaded ${assessments.length} assessments from ${assessmentsPath}`);
    
    // Index all assessments
    await embeddingService.indexAssessments(assessments);
    
    console.log('Free embedding generation complete!');
    
    // Close the embedding service
    embeddingService.close();
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating free embeddings:', error);
    
    // Close the embedding service
    if (embeddingService) {
      embeddingService.close();
    }
    
    process.exit(1);
  }
}

// Run the main function
main();
