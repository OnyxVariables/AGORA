import { useEffect } from "react";
import { toastNotice } from "../services/alerts";
import { API_CONFIG } from "../config/api";

const STORAGE_KEY_ACTIVE = "agora_seen_active_votations";
const STORAGE_KEY_PENDING = "agora_seen_pending_votations";
const STORAGE_KEY_FINISHED = "agora_seen_finished_votations";

function loadSeenIds(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((id) => Number(id)));
  } catch {
    return new Set();
  }
}

function saveSeenIds(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Aviso en la aplicación (toast) (por email en un futuro) cuando hay votaciones activas, programadas o finalizadas que el ciudadano no ha "visto" aún.
 * @param {number|null} userRole - de AuthContext; solo aplica para rol ciudadano (2).
 */
export function useActiveVotationNotice(userRole) {
  useEffect(() => {
    if (userRole !== 2) return;

    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.VOTATIONS_SUMMARY}`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
          },
        );
        if (!res.ok || cancelled) return;
        const rows = await res.json();
        if (!Array.isArray(rows) || cancelled) return;

        const seenActive = loadSeenIds(STORAGE_KEY_ACTIVE);
        const seenPending = loadSeenIds(STORAGE_KEY_PENDING);
        const seenFinished = loadSeenIds(STORAGE_KEY_FINISHED);
        let changedActive = false;
        let changedPending = false;
        let changedFinished = false;

        // Notificar votaciones activas
        const active = rows.filter((r) => r.state === "active");
        for (const v of active) {
          const id = Number(v.id);
          if (!seenActive.has(id)) {
            toastNotice(`"${v.title}" está activa: ya puedes votar.`);
            seenActive.add(id);
            changedActive = true;
          }
        }

        // Notificar votaciones programadas (pending)
        const pending = rows.filter((r) => r.state === "pending");
        for (const v of pending) {
          const id = Number(v.id);
          if (!seenPending.has(id)) {
            const startTime = formatDateTime(v.startDate);
            toastNotice(
              startTime
                ? `"${v.title}" programada: empieza el ${startTime}`
                : `"${v.title}" programada: próximamente`,
            );
            seenPending.add(id);
            changedPending = true;
          }
        }

        // Notificar votaciones finalizadas
        const finished = rows.filter((r) => r.state === "finished");
        for (const v of finished) {
          const id = Number(v.id);
          if (!seenFinished.has(id)) {
            toastNotice(`"${v.title}" ha finalizado: ya puedes ver los resultados.`);
            seenFinished.add(id);
            changedFinished = true;
          }
        }

        if (changedActive) saveSeenIds(STORAGE_KEY_ACTIVE, seenActive);
        if (changedPending) saveSeenIds(STORAGE_KEY_PENDING, seenPending);
        if (changedFinished) saveSeenIds(STORAGE_KEY_FINISHED, seenFinished);
      } catch {
        /* red pública: no bloquear la app */
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userRole]);
}