import axios from 'axios';

const API_BASE_URL = '/api/prices';

// Add timestamp to prevent caching
const getTimestampParam = () => `?t=${new Date().getTime()}`;

// Fetch current prices from the API
export const fetchCurrentPrices = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/current${getTimestampParam()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching current prices:', error);
    throw error;
  }
};

// Fetch all available timestamps
export const fetchTimestamps = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/timestamps${getTimestampParam()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching timestamps:', error);
    throw error;
  }
};

// Fetch historical prices by timestamp
export const fetchHistoricalPrices = async (timestamp) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/historical/${timestamp}${getTimestampParam()}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching historical prices for ${timestamp}:`, error);
    throw error;
  }
}; 