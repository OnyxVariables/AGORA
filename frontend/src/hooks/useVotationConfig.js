import { useEffect, useState } from "react";
import { API_CONFIG } from "../config/api";

// Cachea la respuesta entre montajes para no pegarle al backend cada vez que se 
// abre/cierra el formulario de votaciones. La duración no cambia dentro de la vida de una sesión
let cachedConfig = null;
let inflightPromise = null;

const FALLBACK_CONFIG = {
  duration: {
    minutes: 5,
    hours: 0,
    remainingMinutes: 5,
    label: "5 minutos",
  },
};

async function loadConfig() {
  if (cachedConfig) return cachedConfig;
  if (inflightPromise) return inflightPromise;

  inflightPromise = fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.VOTATIONS_CONFIG}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cachedConfig = data;
      return data;
    })
    .catch((err) => {
      console.warn("useVotationConfig: usando valores por defecto", err);
      cachedConfig = FALLBACK_CONFIG;
      return FALLBACK_CONFIG;
    })
    .finally(() => {
      inflightPromise = null;
    });

  return inflightPromise;
}

 // Devuelve la configuración pública de votaciones (duración fija) leída desde 
 // /api/votations/config. Mientras llega la respuesta usa los valores por defecto, evitando flashes de UI vacía
export function useVotationConfig() {
  const [config, setConfig] = useState(cachedConfig || FALLBACK_CONFIG);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    let cancelled = false;
    if (cachedConfig) {
      setConfig(cachedConfig);
      setLoading(false);
      return;
    }
    loadConfig().then((data) => {
      if (!cancelled) {
        setConfig(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}