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
 * @returns {string}
 */
export function formatBucketLabel(bucketEnd, windowStart, windowEnd) {
  const d = bucketEnd instanceof Date ? bucketEnd : new Date(bucketEnd);
  const start = windowStart instanceof Date ? windowStart : new Date(windowStart);
  const end = windowEnd instanceof Date ? windowEnd : new Date(windowEnd);
  if (Number.isNaN(d.getTime()) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "—";
  }
  const pad = (n) => String(n).padStart(2, "0");
  const totalMs = Math.max(1, end.getTime() - start.getTime());
  const elapsedMs = Math.max(0, d.getTime() - start.getTime());

  if (totalMs < 60 * 60 * 1000) {
    const totalSec = Math.floor(elapsedMs / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return `${pad(mm)}:${pad(ss)}`;
  }
  if (totalMs < 24 * 60 * 60 * 1000) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}