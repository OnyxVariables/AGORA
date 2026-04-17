// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    LOGIN: '/api/login-cert',
    LOGOUT: '/api/logout',
    ME: '/api/me',
    CSRF_COOKIE: '/api/sanctum/csrf-cookie',
    NICKNAME: '/api/nickname',
    VOTATIONS: '/api/votations',
    VOTATIONS_SUMMARY: '/api/votations/summary',
    VOTATION_ACTIVE: '/api/votation/active',
    VOTE: '/api/vote',
    VOTE_VERIFY: '/api/vote/verify',
    METRICS_VOTATION: (id) => `/api/metrics/votation/${id}`,
    VOTATION_RESULTS: (id) => `/api/votations/${id}/results`,
    VOTATION_RESULTS_SUMMARY: (id) => `/api/votations/${id}/results/summary`,
    PARTIES: '/api/parties',
  }
};

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
