let AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_URL ||
  `${window.location.protocol}//auth.${window.location.hostname}`; // https://auth.agorachain.es
  console.log("import.meta.env.VITE_AUTH_URL", import.meta.env.VITE_AUTH_URL);
  if(window.location.hostname === "localhost" && !import.meta.env.VITE_AUTH_URL) {
    AUTH_BASE_URL = "http://localhost:8080";
  }
export const AUTH_CONFIG = {
  baseURL: AUTH_BASE_URL,
  endpoints: {
    CERTIFICATE: `${AUTH_BASE_URL}/api/login-cert`
  },
};
