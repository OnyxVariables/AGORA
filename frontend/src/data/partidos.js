import { useEffect, useState } from "react";
import { API_CONFIG } from "../config/api";

function adaptParty(row) {
  return {
    id: row.id,
    nombre: row.name,
    descripcion: row.description,
    value: row.code,
    imagen: row.image,
    colores: {
      fondo: row.color_background,
      titulo: row.color_title,
    },
    active: row.active ?? true,
  };
}

export function useParties(votationId = null) {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (votationId === false) {
      return;
    }

    const loadParties = async () => {
      try {
        setLoading(true);
        const query = votationId ? `?votationId=${encodeURIComponent(votationId)}` : "";
        const res = await fetch(`${API_CONFIG.endpoints.PARTIES}${query}`);
        if (!res.ok) throw new Error();

        const data = await res.json();
        setPartidos(data.map(adaptParty));
      } catch (err) {
        console.error("Fallo al obtener los partidos", err);
      } finally {
        setLoading(false);
      }
    };

    loadParties();
  }, [votationId]);

  return { partidos, loading };
}

// Partidos ya ordenados alfabéticamente por backend
export function usePartiesCatalog() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_CONFIG.endpoints.PARTIES_CATALOG);
        if (!res.ok) throw new Error();

        const data = await res.json();
        setPartidos(data.map(adaptParty));
      } catch (err) {
        console.error("Fallo al obtener el catálogo de partidos", err);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  return { partidos, loading };
}