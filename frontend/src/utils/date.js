/**
 * Formato de fecha/hora coherente en toda la app (día-mes-año hora:minuto).
 * @param {string|Date|number|null|undefined} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Etiqueta de eje temporal para buckets de métricas (según duración total de la ventana).
 * @param {string|Date} bucketEnd
 * @param {string|Date} windowStart
 * @param {string|Date} windowEnd
 * @param {number} [bucketSecondsHint] si ≤15s, muestra HH:MM:SS para no repetir etiquetas en el mismo minuto
 * @returns {string}
 */
export function formatBucketLabel(bucketEnd, windowStart, windowEnd, bucketSecondsHint) {
  const d = bucketEnd instanceof Date ? bucketEnd : new Date(bucketEnd);
  const start = windowStart instanceof Date ? windowStart : new Date(windowStart);
  const end = windowEnd instanceof Date ? windowEnd : new Date(windowEnd);
  if (Number.isNaN(d.getTime()) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "—";
  }
  const pad = (n) => String(n).padStart(2, "0");
  const totalMs = Math.max(1, end.getTime() - start.getTime());

  const fineSteps =
    typeof bucketSecondsHint === "number" &&
    bucketSecondsHint > 0 &&
    bucketSecondsHint <= 15 &&
    totalMs < 24 * 60 * 60 * 1000;

  if (fineSteps) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  if (totalMs < 24 * 60 * 60 * 1000) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}