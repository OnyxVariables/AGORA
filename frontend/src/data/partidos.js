import { useEffect, useState } from "react";
import { API_CONFIG } from "../config/api";

export function useParties() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParties = async () => {
      try {
        const res = await fetch(API_CONFIG.endpoints.PARTIES);
        if (!res.ok) throw new Error();

        const data = await res.json();

        const adapted = data.map((p) => ({
          id: p.id,
          nombre: p.name,
          descripcion: p.description,
          value: p.code,
          imagen: p.image,
          colores: {
            fondo: p.color_background,
            titulo: p.color_title,
          },
        }));

        setPartidos(adapted);
      } catch (err) {
        console.error("Fallo al obtener los partidos", err);
      } finally {
        setLoading(false);
      }
    };

    loadParties();
  }, []);

  return { partidos, loading };
}