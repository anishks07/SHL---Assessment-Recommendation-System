/**
 * Gemini API Service for SHL Assessment Recommendation System
 * This service integrates with Google's Gemini API to provide advanced NLP capabilities
 * for the recommendation system.
 */

import axios from 'axios';

// Base URL for Gemini API
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'models/gemini-pro';

class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.axios = axios.create({
      baseURL: GEMINI_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate content using Gemini API
   * @param {string} prompt - The prompt to send to Gemini
   * @returns {Promise<Object>} - The response from Gemini
   */
  async generateContent(prompt) {
    try {
      const response = await this.axios.post(
        `/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error calling Gemini API:', error.response?.data || error.message);
      throw new Error(`Gemini API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Extract relevant skills and requirements from a job description or query
   * @param {string} text - The job description or query text
   * @returns {Promise<Object>} - Extracted skills and requirements
   */
  async extractSkillsAndRequirements(text) {
    const prompt = `
    Extract the key skills, requirements, and job role information from the following job description or query.
    Format the output as JSON with the following structure:
    {
      "role": "The main job role or position",
      "skills": ["skill1", "skill2", ...],
      "experience_level": "Entry/Mid/Senior level if mentioned",
      "domain": "Industry or domain if mentioned",
      "soft_skills": ["soft skill1", "soft skill2", ...],
      "technical_skills": ["technical skill1", "technical skill2", ...],
      "time_constraint": "Any time constraints mentioned in minutes"
    }

    Text: ${text}
    `;

    const response = await this.generateContent(prompt);
    
    try {
      // Extract the JSON from the response
      const textResponse = response.candidates[0].content.parts[0].text;
      const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        textResponse.match(/{[\s\S]*?}/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : textResponse;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse skills and requirements from Gemini response');
    }
  }

  /**
   * Recommend assessments based on extracted skills and requirements
   * @param {Object} skillsAndRequirements - The extracted skills and requirements
   * @param {Array} assessments - Available assessments
   * @param {number} timeLimit - Maximum time limit in minutes
   * @returns {Promise<Array>} - Recommended assessments with relevance scores
   */
  async recommendAssessments(skillsAndRequirements, assessments, timeLimit) {
    // Filter assessments by time limit
    const filteredAssessments = assessments.filter(assessment => {
      const durationMatch = assessment.duration.match(/(\d+)/);
      if (!durationMatch) return true;
      
      const duration = parseInt(durationMatch[1], 10);
      return duration <= timeLimit;
    });

    // Create a prompt for Gemini to rank assessments
    const prompt = `
    Given the following job requirements:
    ${JSON.stringify(skillsAndRequirements, null, 2)}
    
    And the following available assessments:
    ${JSON.stringify(filteredAssessments.map(a => ({
      name: a.name,
      test_type: a.test_type,
      description: a.description
    })), null, 2)}
    
    Rank the top assessments (maximum 10) that would be most relevant for evaluating candidates for this position.
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

    const response = await this.generateContent(prompt);
    
    try {
      // Extract the JSON from the response
      const textResponse = response.candidates[0].content.parts[0].text;
      const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        textResponse.match(/{[\s\S]*?}/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : textResponse;
      const rankings = JSON.parse(jsonStr);
      
      // Map the rankings to the full assessment objects
      const recommendations = rankings.recommendations.map(ranking => {
        const assessment = filteredAssessments.find(a => 
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
      
      return recommendations;
    } catch (error) {
      console.error('Error parsing Gemini recommendations:', error);
      throw new Error('Failed to parse assessment recommendations from Gemini response');
    }
  }

  /**
   * Calculate evaluation metrics for recommendations
   * @param {Array} recommendations - Recommended assessments
   * @param {Array} groundTruth - Ground truth relevant assessments
   * @param {number} k - K value for metrics (default: 3)
   * @returns {Object} - Metrics including Recall@K and MAP@K
   */
  calculateMetrics(recommendations, groundTruth, k = 3) {
    // Limit to top K recommendations
    const topK = recommendations.slice(0, k);
    
    // Calculate Recall@K
    const relevantInTopK = topK.filter(rec => 
      groundTruth.some(gt => gt.name === rec.name)
    ).length;
    
    const recall = groundTruth.length > 0 ? 
      relevantInTopK / Math.min(k, groundTruth.length) : 0;
    
    // Calculate MAP@K
    let ap = 0;
    let relevantCount = 0;
    
    for (let i = 0; i < Math.min(k, topK.length); i++) {
      const isRelevant = groundTruth.some(gt => gt.name === topK[i].name);
      
      if (isRelevant) {
        relevantCount++;
        ap += relevantCount / (i + 1);
      }
    }
    
    const map = relevantCount > 0 ? ap / Math.min(k, groundTruth.length) : 0;
    
    return {
      recallAtK: recall,
      mapAtK: map
    };
  }
}

export default GeminiService;
