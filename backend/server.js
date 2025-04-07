import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load assessment data
const assessmentsPath = path.join(__dirname, 'data', 'assessments.json');
const assessments = JSON.parse(fs.readFileSync(assessmentsPath, 'utf8'));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'SHL Assessment Recommendation API',
    endpoints: {
      recommend: 'POST /recommend'
    }
  });
});

// Import Gemini service
import GeminiService from './services/geminiService.mjs';

// Initialize Gemini service with API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
  // Optionally exit or handle the absence of the key gracefully
  // For now, we'll let the GeminiService handle the potential undefined key
}
const geminiService = new GeminiService(GEMINI_API_KEY);

// Recommendation endpoint
app.post('/recommend', async (req, res) => {
  try {
    const { query, jobUrl, jobText, timeLimit } = req.body;
    
    // Validate input
    if (!query && !jobUrl && !jobText) {
      return res.status(400).json({
        error: 'At least one of query, jobUrl, or jobText must be provided'
      });
    }
    
    // Parse time limit
    const parsedTimeLimit = timeLimit ? parseInt(timeLimit, 10) : 60;
    if (isNaN(parsedTimeLimit) || parsedTimeLimit <= 0) {
      return res.status(400).json({
        error: 'Time limit must be a positive number'
      });
    }
    
    // Combine input sources
    let inputText = query || '';
    
    // If job URL is provided, fetch the content
    if (jobUrl) {
      try {
        const response = await axios.get(jobUrl, {
          headers: {
            'User-Agent': 'SHL-Assessment-Recommender/1.0'
          },
          timeout: 5000
        });
        
        // Extract text from HTML (simplified)
        const htmlText = response.data;
        const textContent = extractTextFromHtml(htmlText);
        inputText += ' ' + textContent;
      } catch (error) {
        console.error('Error fetching job URL:', error.message);
        // Continue with other inputs if available
      }
    }
    
    // Add job text if provided
    if (jobText) {
      inputText += ' ' + jobText;
    }
    
    // Trim and normalize input text
    inputText = inputText.trim();
    
    if (!inputText) {
      return res.status(400).json({
        error: 'No valid input text could be processed'
      });
    }
    
    // Use Gemini API for advanced recommendations if text is long enough
    let recommendations = [];
    
    try {
      if (inputText.length > 20) { // Only use Gemini for substantial queries
        console.log('Using Gemini API for recommendations...');
        
        // Extract skills and requirements using Gemini
        const skillsAndRequirements = await geminiService.extractSkillsAndRequirements(inputText);
        console.log('Extracted skills:', skillsAndRequirements);
        
        // Get recommendations using Gemini
        recommendations = await geminiService.recommendAssessments(
          skillsAndRequirements, 
          assessments, 
          parsedTimeLimit
        );
      }
    } catch (error) {
      console.error('Error using Gemini API:', error);
      console.log('Falling back to keyword-based recommendations...');
    }
    
    // If Gemini API failed or returned no recommendations, fall back to keyword-based approach
    if (!recommendations || recommendations.length === 0) {
      recommendations = getRecommendations(inputText, parsedTimeLimit);
    }
    
    // Return recommendations
    return res.json({
      query: inputText,
      timeLimit: parsedTimeLimit,
      recommendations,
      method: recommendations.some(r => r.explanation) ? 'ai' : 'keyword'
    });
    
  } catch (error) {
    console.error('Error in recommendation endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Get assessment recommendations based on input text
 * @param {string} inputText - Query or job description text
 * @param {number} timeLimit - Maximum assessment duration in minutes
 * @returns {Array} - Array of recommended assessments
 */
function getRecommendations(inputText, timeLimit = 60) {
  // Filter by time limit
  const filteredByTime = assessments.filter(assessment => {
    const durationMatch = assessment.duration.match(/(\d+)/);
    if (!durationMatch) return true;
    
    const duration = parseInt(durationMatch[1], 10);
    return duration <= timeLimit;
  });
  
  // Simple keyword matching for demo purposes
  // In a real implementation, this would use more sophisticated NLP techniques
  let recommendations = [];
  const inputTextLower = inputText.toLowerCase();
  
  // Technical skills
  if (inputTextLower.includes('java')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('java') || 
      a.description.toLowerCase().includes('java')
    ));
  }
  
  if (inputTextLower.includes('python')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('python') || 
      a.description.toLowerCase().includes('python')
    ));
  }
  
  if (inputTextLower.includes('javascript') || inputTextLower.includes('js')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('javascript') || 
      a.description.toLowerCase().includes('javascript')
    ));
  }
  
  if (inputTextLower.includes('sql')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('sql') || 
      a.description.toLowerCase().includes('sql')
    ));
  }
  
  if (inputTextLower.includes('full stack') || 
      (inputTextLower.includes('front') && inputTextLower.includes('back'))) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('full stack') || 
      a.description.toLowerCase().includes('full stack')
    ));
  }
  
  // Cognitive abilities
  if (inputTextLower.includes('cognitive') || 
      inputTextLower.includes('reasoning') || 
      inputTextLower.includes('analytical') ||
      inputTextLower.includes('analyst')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('cognitive')
    ));
  }
  
  // Personality
  if (inputTextLower.includes('personality')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('personality')
    ));
  }
  
  // Teamwork and collaboration
  if (inputTextLower.includes('collaborate') || 
      inputTextLower.includes('team') || 
      inputTextLower.includes('communication')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('team') || 
      a.description.toLowerCase().includes('team') ||
      a.description.toLowerCase().includes('collaborat') ||
      a.name.toLowerCase().includes('communication') ||
      a.description.toLowerCase().includes('communicat')
    ));
  }
  
  // Leadership
  if (inputTextLower.includes('leadership') || 
      inputTextLower.includes('lead') || 
      inputTextLower.includes('manage')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('leadership') || 
      a.description.toLowerCase().includes('leadership') ||
      a.description.toLowerCase().includes('management')
    ));
  }
  
  // Customer service
  if (inputTextLower.includes('customer') || 
      inputTextLower.includes('service') || 
      inputTextLower.includes('support')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('customer') || 
      a.description.toLowerCase().includes('customer')
    ));
  }
  
  // Sales
  if (inputTextLower.includes('sales') || 
      inputTextLower.includes('selling') || 
      inputTextLower.includes('business development')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('sales') || 
      a.description.toLowerCase().includes('sales')
    ));
  }
  
  // Remote work
  if (inputTextLower.includes('remote') || 
      inputTextLower.includes('work from home') || 
      inputTextLower.includes('virtual')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('remote') || 
      a.description.toLowerCase().includes('remote')
    ));
  }
  
  // Agile
  if (inputTextLower.includes('agile') || 
      inputTextLower.includes('scrum') || 
      inputTextLower.includes('sprint')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('agile') || 
      a.description.toLowerCase().includes('agile')
    ));
  }
  
  // If no specific keywords matched, return a mix of assessments
  if (recommendations.length === 0) {
    // Include a mix of cognitive, personality, and behavioral assessments
    const cognitiveAssessments = filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('cognitive')
    ).slice(0, 2);
    
    const personalityAssessments = filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('personality')
    ).slice(0, 2);
    
    const behavioralAssessments = filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('behavioral')
    ).slice(0, 1);
    
    recommendations = [
      ...cognitiveAssessments,
      ...personalityAssessments,
      ...behavioralAssessments
    ];
  }
  
  // Remove duplicates
  const uniqueRecommendations = [];
  const seenNames = new Set();
  
  for (const rec of recommendations) {
    if (!seenNames.has(rec.name)) {
      seenNames.add(rec.name);
      uniqueRecommendations.push(rec);
    }
  }
  
  // Limit to 10 results
  const limitedRecommendations = uniqueRecommendations.slice(0, 10);
  
  // Add relevance scores (in a real implementation, this would be more sophisticated)
  const scoredRecommendations = limitedRecommendations.map((rec, index) => ({
    ...rec,
    relevance_score: 100 - (index * 5) // Simple decreasing score
  }));
  
  return scoredRecommendations;
}

/**
 * Extract text content from HTML
 * @param {string} html - HTML content
 * @returns {string} - Extracted text
 */
function extractTextFromHtml(html) {
  // Remove HTML tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
