/**
 * Free RAG (Retrieval-Augmented Generation) Service
 * This service combines free vector search with LLM generation to provide
 * context-aware recommendations for SHL assessments without paid services.
 */

import GeminiService from '../geminiService.mjs';
import FreeEmbeddingService from './freeEmbeddingService.js';

class FreeRagService {
  constructor(geminiApiKey) {
    this.geminiService = new GeminiService(geminiApiKey);
    this.embeddingService = new FreeEmbeddingService();
  }

  /**
   * Get assessment recommendations using RAG approach with free alternatives
   * @param {string} query - The query text
   * @param {number} timeLimit - Maximum assessment duration in minutes
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise<Array>} - Array of recommended assessments
   */
  async getRecommendations(query, timeLimit = 60, maxResults = 10) {
    try {
      // Step 1: Retrieve relevant assessments using vector similarity search
      const similarAssessments = await this.embeddingService.querySimilar(query, timeLimit, 20);
      
      if (!similarAssessments || similarAssessments.length === 0) {
        console.log('No similar assessments found, returning empty array');
        return [];
      }
      
      // Step 2: Extract skills and requirements from the query using Gemini
      const skillsAndRequirements = await this.geminiService.extractSkillsAndRequirements(query);
      
      // Step 3: Use Gemini to re-rank and explain the assessments based on the query context
      const prompt = `
      Given the following job requirements:
      ${JSON.stringify(skillsAndRequirements, null, 2)}
      
      And the following assessments that were retrieved based on semantic similarity:
      ${JSON.stringify(similarAssessments.map(a => ({
        name: a.name,
        test_type: a.test_type,
        description: a.description,
        relevance_score: a.relevance_score
      })), null, 2)}
      
      Rank the top ${maxResults} assessments that would be most relevant for evaluating candidates for this position.
      For each assessment, provide a relevance score from 0-100 and a brief explanation of why it's relevant.
      Format the output as JSON with the following structure:
      {
        "recommendations": [
          {
            "assessment_name": "Name of the assessment",
            "relevance_score": 95,
            "explanation": "Brief explanation of relevance"
          },
          ...
        ]
      }
      
      Consider the following evaluation metrics in your ranking:
      1. Recall - How many of the relevant assessments are included in the top recommendations
      2. Precision - How accurate the ranking is (most relevant assessments should be ranked higher)
      
      Optimize for both Mean Recall@3 and MAP@3 (Mean Average Precision at 3).
      `;
      
      const response = await this.geminiService.generateContent(prompt);
      
      try {
        // Extract the JSON from the response
        const textResponse = response.candidates[0].content.parts[0].text;
        const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                          textResponse.match(/{[\s\S]*?}/);
        
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : textResponse;
        const rankings = JSON.parse(jsonStr);
        
        // Map the rankings to the full assessment objects
        const recommendations = rankings.recommendations.map(ranking => {
          const assessment = similarAssessments.find(a => 
            a.name.toLowerCase() === ranking.assessment_name.toLowerCase() ||
            a.name.toLowerCase().includes(ranking.assessment_name.toLowerCase()) ||
            ranking.assessment_name.toLowerCase().includes(a.name.toLowerCase())
          );
          
          if (!assessment) {
            console.warn(`Assessment not found: ${ranking.assessment_name}`);
            return null;
          }
          
          return {
            ...assessment,
            relevance_score: ranking.relevance_score,
            explanation: ranking.explanation
          };
        }).filter(Boolean);
        
        // Limit to maxResults
        return recommendations.slice(0, maxResults);
      } catch (error) {
        console.error('Error parsing Gemini recommendations:', error);
        
        // Fallback to just returning the top similar assessments if parsing fails
        return similarAssessments.slice(0, maxResults);
      }
    } catch (error) {
      console.error('Error in free RAG recommendation process:', error);
      throw new Error(`Failed to get free RAG recommendations: ${error.message}`);
    }
  }

  /**
   * Initialize the RAG service by ensuring the database exists
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.embeddingService.ensureDatabaseExists();
      console.log('Free RAG service initialized successfully');
    } catch (error) {
      console.error('Error initializing free RAG service:', error);
      throw new Error(`Failed to initialize free RAG service: ${error.message}`);
    }
  }

  /**
   * Close the RAG service and release resources
   */
  close() {
    this.embeddingService.close();
  }
}

export default FreeRagService;
