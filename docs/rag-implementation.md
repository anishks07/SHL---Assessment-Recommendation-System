# RAG Implementation for SHL Assessment Recommendation System

This document outlines the Retrieval-Augmented Generation (RAG) implementation for the SHL Assessment Recommendation System.

## What is RAG?

Retrieval-Augmented Generation (RAG) is an AI architecture that enhances Large Language Models (LLMs) by retrieving relevant information from external knowledge sources before generating responses. This approach combines the strengths of retrieval-based and generation-based systems.

## Our RAG Architecture

Our implementation follows the standard RAG pattern:

1. **Embedding Generation**: Convert assessment data into vector embeddings
2. **Vector Storage**: Store these embeddings in a vector database
3. **Semantic Search**: Perform similarity search on query embeddings
4. **Context-Aware Generation**: Use retrieved context to augment the LLM's response

## Components

### 1. Embedding Service (`backend/services/rag/embeddingService.js`)

This service handles:
- Generating vector embeddings using OpenAI's embedding API
- Storing and retrieving vectors from Pinecone vector database
- Performing semantic similarity search

```javascript
// Example: Generate embeddings for text
async generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  
  return response.data[0].embedding;
}
```

### 2. RAG Service (`backend/services/rag/ragService.js`)

This service orchestrates the RAG workflow:
- Retrieves relevant assessments using vector similarity search
- Extracts skills and requirements from the query using Gemini
- Uses Gemini to re-rank and explain the assessments based on the query context

```javascript
async getRecommendations(query, timeLimit = 60, maxResults = 10) {
  // Step 1: Retrieve relevant assessments using vector similarity search
  const similarAssessments = await this.embeddingService.querySimilar(query, timeLimit, 20);
  
  // Step 2: Extract skills and requirements from the query using Gemini
  const skillsAndRequirements = await this.geminiService.extractSkillsAndRequirements(query);
  
  // Step 3: Use Gemini to re-rank and explain the assessments based on the query context
  // ...
}
```

### 3. Initialization Script (`backend/scripts/generateEmbeddings.js`)

This script initializes the vector database:
- Loads assessment data from JSON
- Generates embeddings for each assessment
- Stores the embeddings in Pinecone

## How It Works

1. **Indexing Phase**:
   - Assessment data is processed to create rich text representations
   - OpenAI's embedding model converts these texts into vector embeddings
   - Vectors are stored in Pinecone with assessment metadata

2. **Query Phase**:
   - User query is converted to a vector embedding
   - Semantic search finds similar assessment vectors in Pinecone
   - Retrieved assessments are re-ranked using Gemini
   - Final recommendations are returned with explanations

## Fallback Mechanisms

Our system implements a robust fallback strategy:
1. First attempt: RAG-based recommendations
2. If RAG fails: Gemini-based recommendations
3. If Gemini fails: Keyword-based recommendations

This ensures the system always returns useful results, even if some components are unavailable.

## Setup Requirements

### Option 1: Using Paid Services (OpenAI + Pinecone)

To enable the RAG implementation with the default paid services:
1. Get an OpenAI API key for generating embeddings
2. Get a Pinecone API key for vector storage
3. Add these keys to your `.env` file
4. Run the initialization script to populate the vector database:
   ```
   npm run init-embeddings
   ```

### Option 2: Using Free Alternatives

If you prefer not to use paid services, you can use free alternatives:
1. See `backend/services/rag/freeAlternatives.md` for implementation details
2. Configure your preferred providers in the `.env` file:
   ```
   RAG_EMBEDDING_PROVIDER=tensorflow
   RAG_VECTOR_DB_PROVIDER=sqlite
   ```
3. The system will automatically use these alternatives

### Note on Implementation

The RAG implementation is completely optional. The system will work without it, falling back to:
1. Gemini API for natural language understanding (requires API key)
2. Keyword-based matching (works without any API keys)

## Performance Considerations

- Vector search is optimized for Mean Recall@3 and MAP@3 metrics
- Batch processing is used during indexing to avoid rate limits
- Caching could be implemented for frequently used queries
