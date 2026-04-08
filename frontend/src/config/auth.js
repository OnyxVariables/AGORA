const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_URL ||
  `${window.location.protocol}//auth.${window.location.hostname}`; // https://auth.agorachain.es

export const AUTH_CONFIG = {
  baseURL: AUTH_BASE_URL,
  endpoints: {
    CERTIFICATE: `${AUTH_BASE_URL}/cert`,
  },
};
