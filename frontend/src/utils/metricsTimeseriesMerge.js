/**
 * Convierte cualquier payload de serie temporal en una serie acumulada de tipo "step line".
 * Si llegan buckets no acumulados, se acumulan; si llegan acumulados, se garantizan no decrecientes.
 *
 * @param {number[]} arr
 * @param {number} len
 * @param {boolean} cumulativeInput
 * @returns {number[]}
 */
function normalizePartySeries(arr, len, cumulativeInput) {
  const out = Array(len).fill(0);
  let running = 0;
  let previous = 0;

  for (let i = 0; i < len; i++) {
    const raw = Number(Array.isArray(arr) ? arr[i] : 0);
    const value = Number.isFinite(raw) ? raw : 0;
    if (cumulativeInput) {
      previous = Math.max(previous, value);
      out[i] = previous;
    } else {
      running += Math.max(0, value);
      out[i] = running;
    }
  }
  return out;
}

/**
 * @param {object|null} timeseries
 * @param {{ id: number }[]} partidos
 * @returns {object|null}
 */
export function normalizeTimeseriesForCharts(timeseries, partidos) {
  if (!timeseries?.labels?.length) {
    return timeseries;
  }

  const len = timeseries.labels.length;
  const byParty = {};
  const cumulativeInput = timeseries.cumulative !== false;
  const partyIds = Array.isArray(partidos)
    ? partidos.map((p) => String(p.id))
    : Object.keys(timeseries.byParty || {});

  partyIds.forEach((key) => {
    byParty[key] = normalizePartySeries(timeseries.byParty?.[key], len, cumulativeInput);
  });

  return {
    ...timeseries,
    cumulative: true,
    byParty,
  };
}