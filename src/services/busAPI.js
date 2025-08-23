// src/api/busAPI.js

import axios from 'axios';

// Support for environment variable override (e.g., in production)
// In Vite projects
const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:3000/api';


// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and error handling
axios.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error);
    return Promise.reject(error);
  }
);

const busAPI = {
  /**
   * Get live bus data with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.routes - Comma-separated route numbers (e.g., "1,2,3")
   * @param {string} filters.busNumber - Bus number to search for
   * @returns {Promise<Object>} API response with bus data
   */
  async getLiveBuses(filters = {}) {
    try {
      // Clean up filters - remove empty values
      const cleanFilters = {};
      
      if (filters.routes && filters.routes.trim()) {
        cleanFilters.routes = filters.routes.trim();
      }
      
      if (filters.busNumber && filters.busNumber.trim()) {
        cleanFilters.busNumber = filters.busNumber.trim();
      }

      // Determine which endpoint to use
      const hasFilters = Object.keys(cleanFilters).length > 0;
      let url;
      
      if (hasFilters) {
        // Use filtered endpoint
        const params = new URLSearchParams(cleanFilters);
        url = `${API_BASE_URL}/buses/filtered?${params.toString()}`;
      } else {
        // Use main buses endpoint
        url = `${API_BASE_URL}/buses`;
      }

      console.log(`[busAPI] Fetching from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
      
    } catch (error) {
      console.error('[busAPI] Error fetching buses:', error);
      
      // Return a consistent error structure
      return {
        success: false,
        error: 'Failed to fetch bus data',
        message: error.message,
        data: []
      };
    }
  },

  /**
   * Get all bus routes
   * @returns {Promise<Object>} API response with routes data
   */
  async getRoutes() {
    try {
      const response = await axios.get(`${API_BASE_URL}/routes`, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[busAPI] Error fetching routes:', error);
      
      return {
        success: false,
        error: 'Failed to fetch routes',
        message: error.message,
        data: []
      };
    }
  },

  /**
   * Get bus stops with optional limit
   * @param {number|null} limit - Maximum number of stops to return
   * @returns {Promise<Object>} API response with stops data
   */
  async getStops(limit = null) {
    try {
      let url = `${API_BASE_URL}/stops`;
      
      if (limit && Number.isInteger(limit) && limit > 0) {
        url += `?limit=${limit}`;
      }
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[busAPI] Error fetching stops:', error);
      
      return {
        success: false,
        error: 'Failed to fetch stops',
        message: error.message,
        data: [],
        count: 0
      };
    }
  },

  /**
   * Check API health status
   * @returns {Promise<Object>} Health check response
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[busAPI] Health check failed:', error);
      
      return {
        success: false,
        status: 'ERROR',
        error: 'Health check failed',
        message: error.message,
        timestamp: new Date()
      };
    }
  },

  /**
   * Test connection to the API
   * @returns {Promise<boolean>} True if API is reachable
   */
  async testConnection() {
    try {
      const health = await this.healthCheck();
      return health.success && health.status === 'OK';
    } catch (error) {
      console.error('[busAPI] Connection test failed:', error);
      return false;
    }
  }
};

export default busAPI;