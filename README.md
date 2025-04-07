# SHL Assessment Recommendation System

An AI-powered web application that recommends SHL assessments based on job descriptions or natural language queries.

## Live Demo

- **Frontend**: [https://shl-assessment-recommendation-system.vercel.app](https://shl-assessment-recommendation-system.vercel.app)
- **API Endpoint**: [https://shl-assessment-recommendation-system.vercel.app/api/recommend](https://shl-assessment-recommendation-system.vercel.app/api/recommend)

## Overview

The SHL Assessment Recommendation System helps hiring managers find the right assessments for their job roles. Using Google's Gemini API, the system analyzes natural language queries or job descriptions and recommends the most relevant SHL assessments.

## Features

- Natural language query input
- Job description URL input
- Direct job description text input
- Time limit filtering
- Up to 10 relevant assessment recommendations
- Detailed assessment information display:
  - Assessment name and URL
  - Remote Testing Support (Yes/No)
  - Adaptive/IRT Support (Yes/No)
  - Duration
  - Test type

## Project Structure

```
shl-assessment-recommender/
├── frontend/                     # Frontend web application
│   ├── index.html                # Main HTML structure
│   ├── styles.css                # CSS styling
│   └── app.js                    # Frontend JavaScript logic
└── backend/                      # Backend API server
    ├── server.js                 # Main Express server file
    ├── package.json              # Node.js dependencies
    └── data/                     # Data storage
        └── assessments.json      # Structured assessment data
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/anishks07/SHL---Assessment-Recommendation-System.git
   
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```
   The server will run on http://localhost:3000

2. Open the frontend:
   - Simply open the `frontend/index.html` file in your browser
   - Or serve it using a simple HTTP server:
     ```
     cd frontend
     npx http-server
     ```
     Then open http://localhost:8080 in your browser

## API Documentation

For detailed API documentation, see [API Docs](docs/api/api-docs.md).

### API Endpoints

#### Vercel Deployment
```
https://shl-assessment-recommendation-system.vercel.app/api/recommend
```

#### Alternative Render Deployment
```
https://shl-recommender-api.onrender.com/api/recommend
```

Both endpoints accept POST requests with JSON payloads containing queries or job descriptions and return relevant SHL assessment recommendations.

## Implementation Details

### Frontend

- Pure HTML, CSS, and JavaScript (no frameworks)
- Responsive design with modern UI elements
- Interactive form with real-time validation
- AI badge indicating AI-powered recommendations

### Backend

- Node.js with Express
- Google Gemini API integration for NLP
- Keyword-based fallback mechanism
- Optimized for evaluation metrics

## Evaluation Metrics

The system is evaluated using:

1. **Mean Recall@3**: Measures how many relevant assessments are in the top 3 results
2. **MAP@3**: Measures both relevance and ranking quality

## Future Improvements

- Implement more sophisticated NLP techniques for better matching
- Add user feedback loop to improve recommendations
- Integrate with SHL's API for real-time assessment data
- Add authentication for personalized recommendations
- Implement caching for frequent queries

## License

This project is licensed under the MIT License - see the LICENSE file for details.
