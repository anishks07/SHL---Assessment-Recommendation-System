/**
 * Script to generate embeddings for all assessments and store them in Pinecone
 * This script should be run once to initialize the vector database
 * 
 * Usage: 
 * 1. Set OPENAI_API_KEY and PINECONE_API_KEY in .env
 * 2. Run: node scripts/generateEmbeddings.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EmbeddingService from '../services/rag/embeddingService.js';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'PINECONE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please set these variables in your .env file');
  process.exit(1);
}

// Initialize embedding service
const embeddingService = new EmbeddingService();

/**
 * Main function to generate and store embeddings
 */
async function main() {
  try {
    console.log('Starting embedding generation process...');
    
    // Ensure the Pinecone index exists
    await embeddingService.ensureIndexExists();
    
    // Load assessments from JSON file
    const assessmentsPath = path.join(__dirname, '..', 'data', 'assessments.json');
    const assessments = JSON.parse(fs.readFileSync(assessmentsPath, 'utf8'));
    
    console.log(`Loaded ${assessments.length} assessments from ${assessmentsPath}`);
    
    // Index all assessments
    await embeddingService.indexAssessments(assessments);
    
    console.log('Embedding generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    process.exit(1);
  }
}

// Run the main function
main();
