# SHL Assessment Recommendation API

## API Endpoint

```
https://shl-recommender-api.onrender.com/api/recommend
```

## Description

This API endpoint provides SHL assessment recommendations based on natural language queries or job descriptions. It uses AI-powered analysis to match job requirements with the most relevant assessments from SHL's catalog.

## Request Format

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
```json
{
  "query": "string",       // Natural language query (optional if jobText is provided)
  "jobText": "string",     // Job description text (optional if query is provided)
  "jobUrl": "string",      // URL to job description (optional)
  "timeLimit": number      // Maximum assessment duration in minutes (optional, default: 60)
}
```

At least one of `query` or `jobText` must be provided.

## Response Format

**Success Response (200 OK):**
```json
{
  "success": true,
  "method": "ai",          // "ai" or "keyword" depending on method used
  "recommendations": [
    {
      "name": "string",    // Assessment name
      "url": "string",     // URL to SHL catalog page
      "remote_testing": boolean,
      "adaptive_support": boolean,
      "duration": "string",
      "test_type": "string",
      "relevance_score": number,
      "explanation": "string"  // AI-generated explanation (only with method="ai")
    }
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "string"        // Error message
}
```

## Example Usage

### Request:
```bash
curl -X POST https://shl-recommender-api.onrender.com/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Java developers who can collaborate effectively with business teams",
    "timeLimit": 40
  }'
```

### Response:
```json
{
  "success": true,
  "method": "ai",
  "recommendations": [
    {
      "name": "Verify - Java",
      "url": "https://www.shl.com/solutions/products/verify-coding/",
      "remote_testing": true,
      "adaptive_support": false,
      "duration": "30 minutes",
      "test_type": "Technical Skills",
      "relevance_score": 95,
      "explanation": "This assessment directly evaluates Java programming skills which is the primary technical requirement in your query."
    },
    {
      "name": "Teamwork Styles Assessment",
      "url": "https://www.shl.com/solutions/products/teamwork-styles/",
      "remote_testing": true,
      "adaptive_support": false,
      "duration": "20 minutes",
      "test_type": "Behavioral",
      "relevance_score": 85,
      "explanation": "This assessment evaluates collaboration styles which addresses the requirement for developers who can work effectively with business teams."
    }
    // Additional recommendations...
  ]
}
```

## Rate Limits

- 100 requests per hour per IP address
- 1000 requests per day per IP address

## Notes

- The API uses Google's Gemini AI for natural language processing
- If the AI service is unavailable, the API falls back to keyword-based matching
- Results are optimized for Mean Recall@3 and MAP@3 metrics
