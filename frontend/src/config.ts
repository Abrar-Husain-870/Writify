// API configuration
const config = {
  // Use environment variable in production, fallback to localhost for development
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
};

export default config;
