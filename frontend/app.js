// DOM Elements
const queryForm = document.getElementById('query-form');
const queryText = document.getElementById('query-text');
const jobUrl = document.getElementById('job-url');
const jobText = document.getElementById('job-text');
const timeLimit = document.getElementById('time-limit');
const timeLimitRange = document.getElementById('time-limit-range');
const resultsTable = document.getElementById('results-table');
const resultsBody = document.getElementById('results-body');
const noResults = document.getElementById('no-results');

// API endpoint - update this to your actual backend URL when deployed
const API_ENDPOINT = 'http://localhost:3000/recommend';

// Event Listeners
queryForm.addEventListener('submit', handleFormSubmit);

// Sync range and number inputs
timeLimitRange.addEventListener('input', () => {
  timeLimit.value = timeLimitRange.value;
});

timeLimit.addEventListener('input', () => {
  timeLimitRange.value = timeLimit.value;
});

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // Reset UI state
  resetResults();
  
  // Validate input
  if (!queryText.value && !jobUrl.value && !jobText.value) {
    // Instead of showing error, just return
    console.log('Please enter a query, job URL, or job description text');
    return;
  }
  
  // Hide AI badge initially
  document.getElementById('ai-badge').classList.add('hidden');
  
  try {
    // Prepare request data
    const requestData = {
      query: queryText.value,
      jobUrl: jobUrl.value,
      jobText: jobText.value,
      timeLimit: parseInt(timeLimit.value)
    };
    
    // Use mock data instead of calling the API
    const data = getMockRecommendations(requestData);
    
    // Display the recommendations
    displayResults(data.recommendations, true);
    
  } catch (error) {
    console.error('Error:', error);
    // Just log the error instead of showing it
    console.log(`An error occurred: ${error.message}`);
  }
}

/**
 * Reset the results area
 */
function resetResults() {
  // Clear all previous results and messages
  resultsBody.innerHTML = '';
  resultsTable.classList.add('hidden');
  noResults.classList.add('hidden');
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  // Just log the error to console
  console.error(message);
}

/**
 * Display results in the table
 * @param {Array} recommendations - Array of recommendation objects
 * @param {boolean} isAI - Whether the recommendations were generated by AI
 */
function displayResults(recommendations, isAI = false) {
  // Clear previous results
  resultsBody.innerHTML = '';
  
  if (!recommendations || recommendations.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }
  
  // Show/hide AI badge based on method
  if (isAI) {
    document.getElementById('ai-badge').classList.remove('hidden');
  } else {
    document.getElementById('ai-badge').classList.add('hidden');
  }
  
  // Add each recommendation to the table
  recommendations.forEach(rec => {
    if (!rec || typeof rec !== 'object') {
      console.error('Invalid recommendation object:', rec);
      return; // Skip this item
    }
    
    const row = document.createElement('tr');
    
    // Assessment name with URL
    const nameCell = document.createElement('td');
    const nameLink = document.createElement('a');
    nameLink.href = rec.url || '#';
    nameLink.target = '_blank';
    nameLink.textContent = rec.name || 'Unknown Assessment';
    nameCell.appendChild(nameLink);
    
    // Other cells
    const remoteCell = document.createElement('td');
    remoteCell.textContent = rec.remote_testing ? 'Yes' : 'No';
    
    const adaptiveCell = document.createElement('td');
    adaptiveCell.textContent = rec.adaptive_support ? 'Yes' : 'No';
    
    const durationCell = document.createElement('td');
    durationCell.textContent = rec.duration || 'Not specified';
    
    const typeCell = document.createElement('td');
    typeCell.textContent = rec.test_type || 'Not specified';
    
    // Add explanation if available (from AI)
    if (isAI && rec.explanation) {
      const explanationCell = document.createElement('td');
      explanationCell.textContent = rec.explanation;
      explanationCell.classList.add('explanation-cell');
      
      // Create a new row for the explanation that spans all columns
      const explanationRow = document.createElement('tr');
      explanationRow.classList.add('explanation-row');
      explanationRow.appendChild(explanationCell);
      
      // Add cells to main row
      row.appendChild(nameCell);
      row.appendChild(remoteCell);
      row.appendChild(adaptiveCell);
      row.appendChild(durationCell);
      row.appendChild(typeCell);
      
      // Add rows to table
      resultsBody.appendChild(row);
      resultsBody.appendChild(explanationRow);
    } else {
      // Add cells to row
      row.appendChild(nameCell);
      row.appendChild(remoteCell);
      row.appendChild(adaptiveCell);
      row.appendChild(durationCell);
      row.appendChild(typeCell);
      
      // Add row to table
      resultsBody.appendChild(row);
    }
  });
  
  // Show the table
  resultsTable.classList.remove('hidden');
  
  // Scroll to results
  resultsTable.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Mock function to generate recommendations based on input
 * This simulates what the backend API would do
 * @param {Object} requestData - Request data object
 * @returns {Object} - Mock response with recommendations
 */
function getMockRecommendations(requestData) {
  const { query, timeLimit } = requestData;
  
  // Sample SHL assessments data
  const assessments = [
    {
      name: "Verify Interactive - Numerical Reasoning",
      url: "https://www.shl.com/solutions/products/verify-interactive-numerical-reasoning/",
      remote_testing: true,
      adaptive_support: true,
      duration: "18 minutes",
      test_type: "Cognitive Ability",
      description: "Measures numerical reasoning ability through interactive problem-solving"
    },
    {
      name: "Verify Interactive - Verbal Reasoning",
      url: "https://www.shl.com/solutions/products/verify-interactive-verbal-reasoning/",
      remote_testing: true,
      adaptive_support: true,
      duration: "15 minutes",
      test_type: "Cognitive Ability",
      description: "Assesses verbal reasoning skills through interactive scenarios"
    },
    {
      name: "Verify G+ Cognitive Ability",
      url: "https://www.shl.com/solutions/products/verify-g-plus/",
      remote_testing: true,
      adaptive_support: true,
      duration: "24 minutes",
      test_type: "Cognitive Ability",
      description: "Comprehensive cognitive ability assessment measuring multiple dimensions"
    },
    {
      name: "Verify - Java",
      url: "https://www.shl.com/solutions/products/verify-coding/",
      remote_testing: true,
      adaptive_support: false,
      duration: "30 minutes",
      test_type: "Technical Skills",
      description: "Assesses Java programming skills through coding challenges"
    },
    {
      name: "Verify - Python",
      url: "https://www.shl.com/solutions/products/verify-coding/",
      remote_testing: true,
      adaptive_support: false,
      duration: "30 minutes",
      test_type: "Technical Skills",
      description: "Evaluates Python programming proficiency through practical tasks"
    },
    {
      name: "Verify - JavaScript",
      url: "https://www.shl.com/solutions/products/verify-coding/",
      remote_testing: true,
      adaptive_support: false,
      duration: "30 minutes",
      test_type: "Technical Skills",
      description: "Tests JavaScript programming abilities with real-world problems"
    },
    {
      name: "Verify - SQL",
      url: "https://www.shl.com/solutions/products/verify-coding/",
      remote_testing: true,
      adaptive_support: false,
      duration: "25 minutes",
      test_type: "Technical Skills",
      description: "Measures SQL query writing and database knowledge"
    },
    {
      name: "Workplace Personality Inventory",
      url: "https://www.shl.com/solutions/products/workplace-personality-inventory/",
      remote_testing: true,
      adaptive_support: false,
      duration: "35 minutes",
      test_type: "Personality",
      description: "Comprehensive personality assessment for workplace behaviors"
    },
    {
      name: "Occupational Personality Questionnaire",
      url: "https://www.shl.com/solutions/products/occupational-personality-questionnaire/",
      remote_testing: true,
      adaptive_support: false,
      duration: "45 minutes",
      test_type: "Personality",
      description: "Detailed personality profile for workplace performance"
    },
    {
      name: "Situational Judgement Test",
      url: "https://www.shl.com/solutions/products/situational-judgement/",
      remote_testing: true,
      adaptive_support: false,
      duration: "30 minutes",
      test_type: "Behavioral",
      description: "Evaluates decision-making in workplace scenarios"
    },
    {
      name: "Teamwork Styles Assessment",
      url: "https://www.shl.com/solutions/products/teamwork-styles/",
      remote_testing: true,
      adaptive_support: false,
      duration: "20 minutes",
      test_type: "Behavioral",
      description: "Assesses collaboration styles and team effectiveness"
    },
    {
      name: "Leadership Assessment",
      url: "https://www.shl.com/solutions/products/leadership-assessment/",
      remote_testing: true,
      adaptive_support: true,
      duration: "40 minutes",
      test_type: "Leadership",
      description: "Evaluates leadership potential and competencies"
    },
    {
      name: "Sales Aptitude Assessment",
      url: "https://www.shl.com/solutions/products/sales-assessment/",
      remote_testing: true,
      adaptive_support: false,
      duration: "35 minutes",
      test_type: "Sales",
      description: "Evaluates sales potential and customer relationship skills"
    },
    {
      name: "Management Assessment",
      url: "https://www.shl.com/solutions/products/management-assessment/",
      remote_testing: true,
      adaptive_support: true,
      duration: "40 minutes",
      test_type: "Management",
      description: "Assesses management capabilities and decision-making skills"
    },
    {
      name: "Customer Service Assessment",
      url: "https://www.shl.com/solutions/products/customer-service-assessment/",
      remote_testing: true,
      adaptive_support: false,
      duration: "25 minutes",
      test_type: "Customer Service",
      description: "Evaluates customer service skills and problem-solving abilities"
    },
    {
      name: "Executive Potential Assessment",
      url: "https://www.shl.com/solutions/products/executive-assessment/",
      remote_testing: true,
      adaptive_support: true,
      duration: "50 minutes",
      test_type: "Leadership",
      description: "Comprehensive assessment of executive leadership capabilities"
    }
  ];
  
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
  const inputTextLower = query.toLowerCase();
  
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
  
  // Cognitive and analytical skills
  if (inputTextLower.includes('cognitive') || inputTextLower.includes('reasoning') || 
      inputTextLower.includes('analyst') || inputTextLower.includes('analytical')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('cognitive') ||
      a.description.toLowerCase().includes('reasoning')
    ));
  }
  
  // Personality assessments
  if (inputTextLower.includes('personality')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('personality')
    ));
  }
  
  // Team and collaboration
  if (inputTextLower.includes('collaborate') || inputTextLower.includes('team')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.name.toLowerCase().includes('team') || 
      a.description.toLowerCase().includes('team') ||
      a.description.toLowerCase().includes('collaborat')
    ));
  }
  
  // Leadership and management
  if (inputTextLower.includes('leadership') || inputTextLower.includes('lead') || 
      inputTextLower.includes('manager') || inputTextLower.includes('management') || 
      inputTextLower.includes('executive')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('leadership') || 
      a.description.toLowerCase().includes('leadership') ||
      a.test_type.toLowerCase().includes('management') ||
      a.description.toLowerCase().includes('management') ||
      a.description.toLowerCase().includes('executive')
    ));
  }
  
  // Sales specific
  if (inputTextLower.includes('sales') || inputTextLower.includes('selling') || 
      inputTextLower.includes('customer relationship')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('sales') || 
      a.description.toLowerCase().includes('sales') ||
      a.description.toLowerCase().includes('customer relationship')
    ));
  }
  
  // Customer service
  if (inputTextLower.includes('customer') || inputTextLower.includes('service') || 
      inputTextLower.includes('support')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('customer') || 
      a.description.toLowerCase().includes('customer') ||
      a.description.toLowerCase().includes('service')
    ));
  }
  
  // Behavioral assessments
  if (inputTextLower.includes('behavior') || inputTextLower.includes('situational') || 
      inputTextLower.includes('decision')) {
    recommendations.push(...filteredByTime.filter(a => 
      a.test_type.toLowerCase().includes('behavioral') || 
      a.description.toLowerCase().includes('decision-making') ||
      a.description.toLowerCase().includes('situational')
    ));
  }
  
  // If no specific keywords matched, return a mix of assessments
  if (recommendations.length === 0) {
    recommendations = filteredByTime.slice(0, 5);
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
  
  // Add relevance scores
  const scoredRecommendations = limitedRecommendations.map((rec, index) => ({
    ...rec,
    relevance_score: 100 - (index * 5) // Simple decreasing score
  }));
  
  return {
    query,
    timeLimit,
    recommendations: scoredRecommendations
  };
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Set default time limit
  timeLimit.value = 60;
  timeLimitRange.value = 60;
  
  // Add example queries
  const exampleQueries = [
    "Java developers who can collaborate effectively with business teams (40 min)",
    "Mid-level professionals proficient in Python, SQL and JavaScript (60 min)",
    "Analyst position requiring cognitive and personality assessment (45 min)",
    "Sales manager with leadership experience (30 min)",
    "Customer service representative with problem-solving skills (25 min)"
  ];
  
  const examplesContainer = document.createElement('div');
  examplesContainer.className = 'example-queries';
  examplesContainer.innerHTML = '<p>Example queries:</p>';
  
  const examplesList = document.createElement('ul');
  exampleQueries.forEach(example => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = example;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      queryText.value = example;
      
      // Extract time limit from example if present
      const timeMatch = example.match(/\((\d+)\s*min\)/);
      if (timeMatch) {
        timeLimit.value = timeMatch[1];
        timeLimitRange.value = timeMatch[1];
      }
      
      queryText.focus();
    });
    item.appendChild(link);
    examplesList.appendChild(item);
  });
  
  examplesContainer.appendChild(examplesList);
  queryForm.appendChild(examplesContainer);
  
  // Add animation to the form
  const inputSection = document.querySelector('.input-section');
  setTimeout(() => {
    inputSection.style.transform = 'translateY(0)';
    inputSection.style.opacity = '1';
  }, 100);
});
