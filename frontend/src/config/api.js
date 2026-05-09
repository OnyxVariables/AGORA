/**
 * Base URL para Laravel API.
 * - Vacío → rutas relativas (`/api/...`): mismo host/puerto/protocolo que la SPA (recomendado en prod detrás de nginx).
 * - URL absoluta solo si la API está en otro origen (entonces definir VITE_API_URL en el build).
 */
function resolveApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t !== "" && t !== "undefined") {
      return t.replace(/\/$/, "");
    }
  }
  return "";
}

export const API_CONFIG = {
  baseURL: resolveApiBaseUrl(),
  endpoints: {
    LOGIN: '/api/login-cert',
    LOGOUT: '/api/logout',
    ME: '/api/me',
    CSRF_COOKIE: '/api/sanctum/csrf-cookie',
    NICKNAME: '/api/nickname',
    VOTATIONS: '/api/votations',
    VOTATIONS_SUMMARY: '/api/votations/summary',
    VOTATIONS_CONFIG: '/api/votations/config',
    VOTATION_ACTIVE: '/api/votation/active',
    VOTE: '/api/vote',
    VOTE_VERIFY: '/api/vote/verify',
    METRICS_VOTATION: (id) => `/api/metrics/votation/${id}`,
    METRICS_VOTATION_VOTES: (id) => `/api/metrics/votation/${id}/votes`,
    METRICS_VOTATION_BLOCKS: (id) => `/api/metrics/votation/${id}/blocks`,
    METRICS_VOTATION_AUDIT: (id) => `/api/metrics/votation/${id}/audit`,
    METRICS_VOTATION_TIMESERIES: (id) => `/api/metrics/votation/${id}/timeseries`,
    VOTATION_VOTES_TIMESERIES_PUBLIC: (id) => `/api/votations/${id}/votes-timeseries`,
    VOTATION_RESULTS: (id) => `/api/votations/${id}/results`,
    VOTATION_RESULTS_SUMMARY: (id) => `/api/votations/${id}/results/summary`,
    PARTIES: '/api/parties',
    PARTIES_CATALOG: '/api/parties/catalog',
    PARTY_IMAGE: (filename) => `/api/parties/image/${filename}`,
    ADMIN_PARTIES: '/api/admin/parties',
    ADMIN_PARTIES_UPLOAD_IMAGE: '/api/admin/parties/upload-image',
    ADMIN_HEALTH_DB: '/api/admin/health/db',
    ADMIN_HEALTH_BLOCKCHAIN: '/api/admin/health/blockchain',
  }
};

// Base HTTP del servicio Spring Boot (métricas en tiempo real, actuator, cluster)
export const SPRING_HTTP_BASE =
  import.meta.env.VITE_SPRING_HTTP_URL || 'http://localhost:8081';

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
