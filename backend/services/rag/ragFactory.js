/**
 * RAG Factory
 * This module provides a factory function to create the appropriate RAG service
 * based on environment variables, avoiding unnecessary imports.
 */

import GeminiService from '../geminiService.mjs';

/**
 * Create a RAG service based on environment variables
 * @param {string} geminiApiKey - Gemini API key
 * @returns {Promise<Object>} - The appropriate RAG service
 */
export async function createRagService(geminiApiKey) {
  // Check if free RAG is enabled
  const useFreeRag = process.env.USE_FREE_RAG === 'true';
  
  if (useFreeRag) {
    // Use free RAG implementation (TensorFlow.js + SQLite)
    console.log("Initializing free RAG service with TensorFlow.js and SQLite...");
    
    // Dynamically import the free RAG service
    const { default: FreeRagService } = await import('./freeRagService.js');
    const ragService = new FreeRagService(geminiApiKey);
    
    // Initialize the service
    try {
      await ragService.initialize();
      console.log("Free RAG service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize free RAG service:", error);
    }
    
    return ragService;
  } else {
    // Check if OpenAI and Pinecone API keys are available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    
    if (openaiApiKey && pineconeApiKey) {
      // Use paid RAG implementation (OpenAI + Pinecone)
      console.log("Initializing RAG service with OpenAI and Pinecone...");
      
      // Dynamically import the paid RAG service
      const { default: RAGService } = await import('./ragService.js');
      const ragService = new RAGService(geminiApiKey, openaiApiKey, pineconeApiKey);
      
      // Initialize the service
      try {
        await ragService.initialize();
        console.log("RAG service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize RAG service:", error);
      }
      
      return ragService;
    }
  }
  
  // If no RAG service could be created, return null
  console.log("RAG service will not be available. Using Gemini API and keyword fallback only.");
  return null;
}
