// auth.agorachain.es, no auth.www.agorachain.es (ese host no existe → ERR_CONNECTION_REFUSED)
function rootHostname(hostname) {
  return hostname.replace(/^www\./i, "") || hostname;
}

let AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_URL ||
  `${window.location.protocol}//auth.${rootHostname(window.location.hostname)}`;

if (window.location.hostname === "localhost" && !import.meta.env.VITE_AUTH_URL) {
  AUTH_BASE_URL = "http://localhost:8080";
}

export const AUTH_CONFIG = {
  baseURL: AUTH_BASE_URL,
  endpoints: {
    CERTIFICATE: `${AUTH_BASE_URL}/api/login-cert`,
  },
};
