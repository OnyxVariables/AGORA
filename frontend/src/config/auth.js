/** Quitar www para montar auth.<dominio> (no auth.www...). */
function rootHostname(hostname) {
  return hostname.replace(/^www\./i, "") || hostname;
}

function defaultAuthBaseUrl() {
  const proto = window.location.protocol;
  const host = rootHostname(window.location.hostname);
  return `${proto}//auth.${host}`;
}

let AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_URL?.trim() || defaultAuthBaseUrl();

if (window.location.hostname === "localhost" && !import.meta.env.VITE_AUTH_URL?.trim()) {
  AUTH_BASE_URL = "http://localhost:8080";
} else if (window.location.hostname !== "localhost") {
  // FNMT: nginx con ssl_verify_client está en auth.*; VITE_AUTH_URL=https://agorachain.es rompe (connection refused / sin cert).
  const normalized = AUTH_BASE_URL.replace(/\/$/, "");
  if (!/^https?:\/\/auth\./i.test(normalized)) {
    AUTH_BASE_URL = defaultAuthBaseUrl();
  }
}

export const AUTH_CONFIG = {
  baseURL: AUTH_BASE_URL,
  endpoints: {
    CERTIFICATE: `${AUTH_BASE_URL}/cert`,
  },
};
