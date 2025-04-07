# SHL Assessment Recommendation System

## Overview
This project implements an intelligent recommendation system for SHL assessments, designed to simplify the process of finding relevant assessments based on natural language queries or job descriptions.

## Features
- Takes a natural language query or job description URL.
- Recommends up to 10 relevant individual test solutions.
- Each recommendation includes:
  - Assessment name and URL (linked to SHL’s catalog)
  - Remote Testing Support (Yes/No)
  - Adaptive/IRT Support (Yes/No)
  - Duration and Test type

## Technologies Used
- **Node.js**: Backend server
- **Express**: Web framework for Node.js
- **TensorFlow.js**: For generating embeddings
- **SQLite**: For vector storage
- **Gemini API**: For natural language processing
- **Axios**: For making HTTP requests

## Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file based on the `.env.example` file.
   - Set the `GEMINI_API_KEY` and other necessary keys.

4. **Generate embeddings**:
   ```bash
   npm run init-free-embeddings
   ```

5. **Run the server**:
   ```bash
   npm run dev
   ```

6. **Access the API**:
   - The server will run on `http://localhost:3000`.
   - Use the `/recommend` endpoint to get recommendations.

## Manual Deployment
To deploy the application manually:
1. Ensure all dependencies are installed.
2. Set up the environment variables as described above.
3. Run the server using `npm run dev`.
4. Access the application through your browser or API client.

## Evaluation Criteria
The solution will be evaluated based on:
- **Approach**: How the data is crawled, represented, and searched.
- **Accuracy**: Measured using Mean Recall@3 and MAP@3.
- **Demo Quality**: Quality of the end-to-end demo.

## Testing Queries
You can test the application with the following queries:
- "I am hiring for Java developers who can also collaborate effectively with my business teams. Looking for an assessment(s) that can be completed in 40 minutes."
- "Looking to hire mid-level professionals who are proficient in Python, SQL and Java Script. Need an assessment package that can test all skills with max duration of 60 minutes."
- "Here is a JD text, can you recommend some assessment that can help me screen applications. Time limit is less than 30 minutes."
- "I am hiring for an analyst and want applications to screen using Cognitive and personality tests, what options are available within 45 mins."

## Conclusion
This project aims to provide a streamlined solution for hiring managers to find the right assessments efficiently. The use of free technologies ensures accessibility and cost-effectiveness.
