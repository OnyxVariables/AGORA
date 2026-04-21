/**
 * Genera CSV (UTF-8 con BOM para Excel) a partir del bundle de métricas.
 * @param {object} bundle - Respuesta de GET /api/metrics/votation/:id
 * @returns {string}
 */
export function metricsBundleToCsv(bundle) {
  const lines = [];
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const v = bundle?.votation ?? {};
  lines.push(["AGORA — Exportación de métricas"].join(","));
  lines.push(["Generado", formatDate(new Date())].map(esc).join(","));
  lines.push([]);
  lines.push(["Votación", "ID", "Título", "Estado", "Inicio", "Fin"].map(esc).join(","));
  lines.push(
    [
      "",
      v.id,
      v.title,
      v.state,
      formatDate(v.startDate),
      v.endDate ? formatDate(v.endDate) : "",
    ]
      .map(esc)
      .join(","),
  );
  lines.push([]);
  const m = bundle?.metrics ?? {};
  lines.push(["Resumen", "Clave", "Valor"].map(esc).join(","));
  lines.push(["", "totalVotes", m.totalVotes].map(esc).join(","));
  lines.push(["", "registeredCitizens", m.registeredCitizens].map(esc).join(","));
  lines.push(["", "participationRate_pct", m.participationRate].map(esc).join(","));
  lines.push([]);
  const seatsByParty = m.seatsByParty ?? {};
  lines.push(["Votos por partido (partyId)", "votos", "escaños"].map(esc).join(","));
  Object.entries(m.votesByParty ?? {}).forEach(([pid, c]) => {
    const hasSeat = Object.prototype.hasOwnProperty.call(seatsByParty, pid);
    const seats = hasSeat ? seatsByParty[pid] : "";
    lines.push([pid, c, seats].map(esc).join(","));
  });
  lines.push([]);
  lines.push(["Votos por municipio (municipalityId)", "votos"].map(esc).join(","));
  Object.entries(m.votesByMunicipality ?? {}).forEach(([mid, c]) => {
    lines.push([mid, c].map(esc).join(","));
  });
  lines.push([]);
  lines.push(
    [
      "Voto id",
      "voteHash",
      "partyId",
      "partyName",
      "municipalityId",
      "municipalityName",
      "provinceName",
      "autonomousCommunityName",
      "blockHash",
      "txHash",
      "createdAt",
    ]
      .map(esc)
      .join(","),
  );
  (bundle?.votes ?? []).forEach((row) => {
    lines.push(
      [
        row.id,
        row.voteHash,
        row.partyId,
        row.partyName,
        row.municipalityId,
        row.municipalityName ?? "",
        row.provinceName ?? "",
        row.autonomousCommunityName ?? "",
        row.blockHash,
        row.txHash,
        formatDate(row.createdAt),
      ]
        .map(esc)
        .join(","),
    );
  });
  lines.push([]);
  lines.push(
    ["Bloque hash", "número", "HASH ANTERIOR", "TXS", "válido", "creado"]
      .map(esc)
      .join(","),
  );
  (bundle?.blocks ?? []).forEach((b) => {
    lines.push(
      [
        b.hash,
        b.blockNumber,
        b.previousHash ?? "",
        b.transactions,
        b.isValid ? "1" : "0",
        formatDate(b.createdAt),
      ]
        .map(esc)
        .join(","),
    );
  });
  lines.push([]);
  lines.push(
    [
      "Auditoría id",
      "userId",
      "userName",
      "action",
      "description",
      "txHash",
      "blockHash",
      "createdAt",
    ]
      .map(esc)
      .join(","),
  );
  (bundle?.audit ?? []).forEach((a) => {
    lines.push(
      [
        a.id,
        a.userId,
        a.userName ?? a.userNickname ?? "",
        a.action,
        a.description ?? "",
        a.txHash ?? "",
        a.blockHash ?? "",
        formatDate(a.createdAt),
      ]
        .map(esc)
        .join(","),
    );
  });

  const body = lines.join("\r\n");
  return `\ufeff${body}`;
}

// Informe HTML legible para archivo .html
export function metricsBundleToHtml(bundle) {
  const v = bundle?.votation ?? {};
  const m = bundle?.metrics ?? {};
  const votes = bundle?.votes ?? [];
  const blocks = bundle?.blocks ?? [];
  const audit = bundle?.audit ?? [];

  const rowsVotes = votes
    .map((r) => {
      const geo = [r.municipalityName, r.provinceName, r.autonomousCommunityName]
        .filter(Boolean)
        .join(" · ");
      const mun = geo || r.municipalityId;
      return `<tr><td>${escapeHtml(r.id)}</td><td><code>${escapeHtml(r.voteHash)}</code></td><td>${escapeHtml(r.partyName)}</td><td>${escapeHtml(mun)}</td><td><code>${escapeHtml(shortHash(r.blockHash))}</code></td><td>${escapeHtml(formatDate(r.createdAt))}</td></tr>`;
    })
    .join("");

  const rowsBlocks = blocks
    .map(
      (b) =>
        `<tr><td>${escapeHtml(b.blockNumber)}</td><td><code>${escapeHtml(shortHash(b.hash))}</code></td><td><code>${escapeHtml(shortHash(b.previousHash))}</code></td><td>${escapeHtml(b.transactions ?? "—")}</td><td>${b.isValid ? "Sí" : "No"}</td><td>${escapeHtml(formatDate(b.createdAt))}</td></tr>`,
    )
    .join("");

  const rowsAudit = audit
    .map(
      (a) =>
        `<tr><td>${escapeHtml(a.id)}</td><td>${escapeHtml(a.userName ?? "—")}</td><td>${escapeHtml(a.action)}</td><td>${escapeHtml(a.description ?? "")}</td><td><code>${escapeHtml(shortHash(a.txHash))}</code></td><td><code>${escapeHtml(shortHash(a.blockHash))}</code></td><td>${escapeHtml(formatDate(a.createdAt))}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>AGORA — Métricas votación ${escapeHtml(v.id)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1100px; margin: 2rem auto; padding: 0 1rem; color: #222; background: #faf8ff; }
    h1 { color: #3d0091; border-bottom: 3px solid #eebefa; padding-bottom: 0.5rem; }
    h2 { color: #6a00d4; margin-top: 2rem; }
    .card { background: #fff; border: 2px solid #000; border-radius: 12px; padding: 1rem 1.25rem; margin: 1rem 0; box-shadow: 8px 8px 0 #8c00dd20; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    th { background: #eebefa; border: 1px solid #000; padding: 0.6rem; text-align: left; }
    td { border: 1px solid #333; padding: 0.5rem; }
    code { font-size: 0.85em; }
    .meta { color: #555; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>AGORA — Informe de métricas</h1>
  <p class="meta">Generado: ${escapeHtml(formatDate(new Date()))}</p>
  <div class="card">
    <h2>Votación</h2>
    <p><strong>ID:</strong> ${escapeHtml(v.id)} &nbsp; <strong>Estado:</strong> ${escapeHtml(v.state)}</p>
    <p><strong>Título:</strong> ${escapeHtml(v.title)}</p>
    <p><strong>Inicio / fin:</strong> ${escapeHtml(formatDate(v.startDate))} — ${escapeHtml(formatDate(v.endDate))}</p>
  </div>
  <div class="card">
    <h2>Participación</h2>
    <p><strong>Votos registrados:</strong> ${escapeHtml(m.totalVotes)}</p>
    <p><strong>Ciudadanos registrados (rol):</strong> ${escapeHtml(m.registeredCitizens)}</p>
    <p><strong>Tasa participación (%):</strong> ${escapeHtml(m.participationRate)}</p>
  </div>
  <div class="card">
    <h2>Votos</h2>
    <table>
      <thead><tr><th>ID</th><th>Hash voto</th><th>Partido</th><th>Municipio / territorio</th><th>Bloque</th><th>CREADO</th></tr></thead>
      <tbody>${rowsVotes || "<tr><td colspan='6'>Sin votos</td></tr>"}</tbody>
    </table>
  </div>
  <div class="card">
    <h2>Bloques</h2>
    <table>
      <thead><tr><th>Nº</th><th>Hash</th><th>HASH ANTERIOR</th><th>NÚMERO TRANSACCIONES</th><th>Válido</th><th>CREADO</th></tr></thead>
      <tbody>${rowsBlocks || "<tr><td colspan='6'>Sin bloques</td></tr>"}</tbody>
    </table>
  </div>
  <div class="card">
    <h2>Auditoría</h2>
    <table>
      <thead><tr><th>ID</th><th>Usuario</th><th>Acción</th><th>Descripción</th><th>TX HASH</th><th>BLOCK HASH</th><th>Fecha</th></tr></thead>
      <tbody>${rowsAudit || "<tr><td colspan='7'>Sin registros o tabla no disponible</td></tr>"}</tbody>
    </table>
  </div>
</body>
</html>`;
}

function shortHash(h) {
  if (!h || h.length < 12) return h ?? "";
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

function formatDate(dateValue) {
  if (!dateValue || dateValue === "—") return "—";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const EXPORT_PAGE_SIZE = 500;

/**
 * Ensambla el bundle completo paginando la API (exportación CSV/HTML).
 *
 * @param {number} votationId
 * @param {string} baseURL - ej. API_CONFIG.baseURL
 * @returns {Promise<object>}
 */
export async function fetchFullMetricsBundleForExport(votationId, baseURL) {
  const credentials = "include";
  const headers = { Accept: "application/json" };
  const root = `${String(baseURL).replace(/\/$/, "")}/api/metrics/votation/${votationId}`;

  const summaryRes = await fetch(root, { credentials, headers });
  if (!summaryRes.ok) {
    throw new Error(`Resumen métricas: HTTP ${summaryRes.status}`);
  }
  const summary = await summaryRes.json();

  async function fetchPaged(suffix, extraParams = "") {
    const all = [];
    let page = 1;
    const maxPages = 10000;
    for (let guard = 0; guard < maxPages; guard += 1) {
      const q = new URLSearchParams({
        page: String(page),
        pageSize: String(EXPORT_PAGE_SIZE),
      });
      if (extraParams) {
        const extra = new URLSearchParams(extraParams);
        extra.forEach((v, k) => q.set(k, v));
      }
      const url = `${root}${suffix}?${q.toString()}`;
      const r = await fetch(url, { credentials, headers });
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${suffix}`);
      }
      const j = await r.json();
      const chunk = j.data ?? [];
      all.push(...chunk);
      const total = j.total ?? 0;
      if (all.length >= total || chunk.length === 0) {
        break;
      }
      page += 1;
    }
    return all;
  }

  const votes = await fetchPaged("/votes");
  const blocks = await fetchPaged("/blocks");
  const audit = await fetchPaged("/audit");

  return {
    votation: summary.votation,
    metrics: summary.metrics,
    blockFilterOptions: summary.blockFilterOptions,
    votes,
    blocks,
    audit,
  };
}

/**
 * @param {string} content
 * @param {string} filename
 * @param {string} mime
 */
export function downloadTextFile(content, filename, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}