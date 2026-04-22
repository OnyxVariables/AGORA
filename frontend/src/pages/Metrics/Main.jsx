import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./Main.css";
import SectionContainer from "../../components/SectionContainer/SectionContainer";
import Select from "../../components/Select/Select";
import Table from "../../components/Table/Table";
import ChartSection from "../../components/ChartSection/ChartSection";
import { useWebSocket } from "../../hooks/useWebSocket";
import { API_CONFIG } from "../../config/api";
import { popupError, toastTiny } from "../../services/alerts";
import { formatDate } from "../../utils/date";
import { useParties } from "../../data/partidos";
import {
  downloadTextFile,
  fetchFullMetricsBundleForExport,
  metricsBundleToCsv,
  metricsBundleToHtml,
} from "../../utils/metricsExport";

const PAGE_SIZE = 100;

export default function Main() {
  const [votationList, setVotationList] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [selectedVotation, setSelectedVotation] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [voteMetrics, setVoteMetrics] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [votesPage, setVotesPage] = useState(1);
  const [votesRefreshTick, setVotesRefreshTick] = useState(0);
  const [votesRows, setVotesRows] = useState([]);
  const [votesTotal, setVotesTotal] = useState(0);
  const [votesLoading, setVotesLoading] = useState(false);
  const [votesError, setVotesError] = useState(null);

  const [blocksPage, setBlocksPage] = useState(1);
  const [blocksRowsRaw, setBlocksRowsRaw] = useState([]);
  const [blocksTotal, setBlocksTotal] = useState(0);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blocksError, setBlocksError] = useState(null);

  const [auditPage, setAuditPage] = useState(1);
  const [auditRowsRaw, setAuditRowsRaw] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  const { partidos } = useParties();

  const partyNameById = useMemo(() => {
    const map = {};
    partidos.forEach((p) => {
      map[p.id] = p.nombre;
    });
    return map;
  }, [partidos]);

  const votationOptions = useMemo(
    () =>
      votationList.map((v) => ({
        value: v.id,
        label: `#${v.id} — ${v.title} (${v.state})`,
      })),
    [votationList],
  );

  const blockOptions = useMemo(() => {
    const opts = bundle?.blockFilterOptions ?? [];
    return opts.map((b) => ({
      value: b.hash,
      label: `Bloque ${b.blockNumber} — ${b.hash.slice(0, 10)}…`,
    }));
  }, [bundle]);

  const userRoleOptions = [
    { value: "2", label: "Ciudadano" },
    { value: "1", label: "Admin" },
  ];

  const CopyButton = useCallback(({ text }) => {
    if (!text) return null;
    const handleCopy = () => {
      navigator.clipboard.writeText(text).then(() => {
        toastTiny("Copiado");
      }).catch(() => {});
    };
    return (
      <button
        type="button"
        onClick={handleCopy}
        title="Copiar al portapapeles"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 0 0 4px",
          display: "inline-flex",
          alignItems: "center",
          verticalAlign: "middle",
        }}
      >
        <img
          src="/img/copy.svg"
          alt="Copiar"
          width="14"
          height="14"
          style={{ filter: "invert(0.4)" }}
        />
      </button>
    );
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.VOTATIONS}`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setVotationList(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedVotation((prev) => prev ?? data[0].id);
        }
      } catch (err) {
        console.error("Error cargando votaciones:", err);
        setLoadError("No se pudieron cargar las votaciones, ¿estás autorizado?");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedVotation) {
      setBundle(null);
      return;
    }
    const loadBundle = async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.METRICS_VOTATION(selectedVotation)}`,
          { credentials: "include" },
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setBundle(data);
        setSelectedBlock("");
        setVotesPage(1);
        setBlocksPage(1);
        setAuditPage(1);
        if (data.metrics) {
          setVoteMetrics({
            votationId: data.metrics.votationId,
            totalVotes: data.metrics.totalVotes,
            votesByParty: data.metrics.votesByParty || {},
            votesByMunicipality: data.metrics.votesByMunicipality || {},
            votesByProvinceName: data.metrics.votesByProvinceName || {},
            timestamp: data.metrics.timestamp,
          });
        }
      } catch (err) {
        console.error("Error cargando bundle métricas:", err);
        popupError("No se pudieron cargar los datos de la votación");
      }
    };
    loadBundle();
  }, [selectedVotation]);

  useEffect(() => {
    if (!selectedVotation) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setVotesLoading(true);
      setVotesError(null);
      try {
        const q = new URLSearchParams({
          page: String(votesPage),
          pageSize: String(PAGE_SIZE),
        });
        if (selectedBlock) {
          q.set("blockHash", selectedBlock);
        }
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.METRICS_VOTATION_VOTES(selectedVotation)}?${q}`;
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        setVotesRows(Array.isArray(data.data) ? data.data : []);
        setVotesTotal(Number(data.total) || 0);
      } catch (e) {
        if (!cancelled) {
          setVotesError(e?.message || "Error al cargar votos");
          setVotesRows([]);
          setVotesTotal(0);
        }
      } finally {
        if (!cancelled) {
          setVotesLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedVotation, votesPage, selectedBlock, votesRefreshTick]);

  useEffect(() => {
    if (!selectedVotation) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setBlocksLoading(true);
      setBlocksError(null);
      try {
        const q = new URLSearchParams({
          page: String(blocksPage),
          pageSize: String(PAGE_SIZE),
        });
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.METRICS_VOTATION_BLOCKS(selectedVotation)}?${q}`;
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        setBlocksRowsRaw(Array.isArray(data.data) ? data.data : []);
        setBlocksTotal(Number(data.total) || 0);
      } catch (e) {
        if (!cancelled) {
          setBlocksError(e?.message || "Error al cargar bloques");
          setBlocksRowsRaw([]);
          setBlocksTotal(0);
        }
      } finally {
        if (!cancelled) {
          setBlocksLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedVotation, blocksPage]);

  useEffect(() => {
    if (!selectedVotation) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setAuditLoading(true);
      setAuditError(null);
      try {
        const q = new URLSearchParams({
          page: String(auditPage),
          pageSize: String(PAGE_SIZE),
        });
        if (selectedUser) {
          q.set("role", selectedUser);
        }
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.METRICS_VOTATION_AUDIT(selectedVotation)}?${q}`;
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        setAuditRowsRaw(Array.isArray(data.data) ? data.data : []);
        setAuditTotal(Number(data.total) || 0);
      } catch (e) {
        if (!cancelled) {
          setAuditError(e?.message || "Error al cargar auditoría");
          setAuditRowsRaw([]);
          setAuditTotal(0);
        }
      } finally {
        if (!cancelled) {
          setAuditLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedVotation, auditPage, selectedUser]);

  const pendingMetricsRef = useRef(null);
  const rafMetricsRef = useRef(null);

  const handleVoteReceived = useCallback(
    (voteData) => {
      if (voteData.votationId !== selectedVotation) return;
      pendingMetricsRef.current = voteData;
      if (rafMetricsRef.current != null) return;
      rafMetricsRef.current = requestAnimationFrame(() => {
        rafMetricsRef.current = null;
        const data = pendingMetricsRef.current;
        pendingMetricsRef.current = null;
        if (!data) return;
        setVoteMetrics({
          votationId: data.votationId,
          totalVotes: data.totalVotes,
          votesByParty: data.votesByParty || {},
          votesByMunicipality: data.votesByMunicipality || {},
          votesByProvinceName: data.votesByProvinceName || {},
          timestamp: data.timestamp,
        });
        setBundle((prev) => {
          if (!prev || prev.votation?.id !== data.votationId) return prev;
          const reg = prev.metrics?.registeredCitizens ?? 0;
          const total = data.totalVotes ?? prev.metrics?.totalVotes ?? 0;
          const partRate =
            reg > 0 ? Math.round((total / reg) * 100 * 100) / 100 : 0;
          return {
            ...prev,
            metrics: {
              ...prev.metrics,
              totalVotes: total,
              votesByParty: data.votesByParty || prev.metrics?.votesByParty,
              votesByMunicipality:
                data.votesByMunicipality || prev.metrics?.votesByMunicipality,
              votesByProvinceName:
                data.votesByProvinceName || prev.metrics?.votesByProvinceName,
              participationRate: partRate,
              timestamp: data.timestamp ?? prev.metrics?.timestamp,
            },
          };
        });
      });
    },
    [selectedVotation],
  );

  const wsUrl = import.meta.env.VITE_SPRING_WS_URL || "ws://localhost:8081/ws";
  useWebSocket(wsUrl, handleVoteReceived);

  const votationSummaryRows = useMemo(() => {
    if (!bundle?.votation) return [];
    const v = bundle.votation;
    return [
      { field: "ID", value: v.id },
      { field: "Título", value: v.title },
      { field: "Descripción", value: v.description },
      { field: "Estado", value: v.state },
      { field: "Inicio", value: formatDate(v.startDate) },
      { field: "Fin", value: formatDate(v.endDate) },
      {
        field: "txHash",
        value: v.txHash ? (
          <>{v.txHash.slice(0, 14)}…<CopyButton text={v.txHash} /></>
        ) : "—",
      },
    ];
  }, [bundle, CopyButton]);

  const participationRows = useMemo(() => {
    const m = bundle?.metrics;
    if (!m) return [];
    const reg = m.registeredCitizens ?? 0;
    const total = m.totalVotes ?? 0;
    const rate =
      reg > 0 ? Math.round((total / reg) * 100 * 100) / 100 : 0;
    return [
      { metric: "Votos totales", value: total },
      { metric: "Ciudadanos registrados", value: reg },
      { metric: "Participación (%)", value: rate },
    ];
  }, [bundle?.metrics]);

  const votesDetailRows = useMemo(() => {
    return votesRows.map((r) => {
      const mName = r.municipalityName;
      const pName = r.provinceName;
      const ccaa = r.autonomousCommunityName;
      const hasGeo =
        (mName && String(mName).trim() !== "") ||
        (pName && String(pName).trim() !== "") ||
        (ccaa && String(ccaa).trim() !== "");
      const municipioCell = hasGeo ? (
        <div className="muni-cell">
          {mName && String(mName).trim() !== "" ? (
            <strong>{mName}</strong>
          ) : (
            <strong className="muni-missing">Municipio #{r.municipalityId}</strong>
          )}
          <span className="muni-sub">
            {[pName, ccaa].filter(Boolean).join(" · ") || "—"}
          </span>
        </div>
      ) : (
        <span className="muni-missing">#{r.municipalityId}</span>
      );
      return {
        id: r.id,
        party: r.partyName,
        municipio: municipioCell,
        bloque: r.blockHash ? (
          <>{r.blockHash.slice(0, 10)}…<CopyButton text={r.blockHash} /></>
        ) : "—",
        tx: r.txHash ? (
          <>{r.txHash.slice(0, 10)}…<CopyButton text={r.txHash} /></>
        ) : "—",
        creado: formatDate(r.createdAt),
      };
    });
  }, [votesRows, CopyButton]);

  const auditRows = useMemo(() => {
    return auditRowsRaw.map((a) => ({
      id: a.id,
      user:
        a.userName && String(a.userName).trim() !== ""
          ? String(a.userName).trim()
          : `Usuario #${a.userId}`,
      action: a.action,
      desc: a.description || "—",
      tx: a.txHash ? (
        <>{a.txHash.slice(0, 12)}…<CopyButton text={a.txHash} /></>
      ) : "—",
      block: a.blockHash ? (
        <>{a.blockHash.slice(0, 12)}…<CopyButton text={a.blockHash} /></>
      ) : "—",
      fecha: formatDate(a.createdAt),
    }));
  }, [auditRowsRaw, CopyButton]);

  const blocksRows = useMemo(() => {
    return blocksRowsRaw.map((b) => ({
      num: b.blockNumber,
      hash: (
        <>{b.hash.slice(0, 12)}…<CopyButton text={b.hash} /></>
      ),
      prev: b.previousHash ? (
        <>{b.previousHash.slice(0, 10)}…<CopyButton text={b.previousHash} /></>
      ) : "—",
      txs: b.transactions,
      ok: b.isValid ? "Sí" : "No",
      creado: formatDate(b.createdAt),
    }));
  }, [blocksRowsRaw, CopyButton]);

  useEffect(() => {
    const onExport = async () => {
      if (!bundle?.votation) {
        popupError("Selecciona una votación con datos cargados");
        return;
      }
      const id = bundle.votation.id;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      try {
        toastTiny("Generando exportación…");
        const full = await fetchFullMetricsBundleForExport(id, API_CONFIG.baseURL);
        downloadTextFile(
          metricsBundleToCsv(full),
          `agora-metricas-${id}-${stamp}.csv`,
          "text/csv;charset=utf-8",
        );
        downloadTextFile(
          metricsBundleToHtml(full),
          `agora-metricas-${id}-${stamp}.html`,
          "text/html;charset=utf-8",
        );
        toastTiny("Exportación lista");
      } catch (e) {
        console.error(e);
        popupError("No se pudo exportar. Reintenta.");
      }
    };
    window.addEventListener("agora-export-metrics", onExport);
    return () => window.removeEventListener("agora-export-metrics", onExport);
  }, [bundle]);

  const votesPagesTotal = Math.max(1, Math.ceil(votesTotal / PAGE_SIZE));
  const blocksPagesTotal = Math.max(1, Math.ceil(blocksTotal / PAGE_SIZE));
  const auditPagesTotal = Math.max(1, Math.ceil(auditTotal / PAGE_SIZE));

  return (
    <main className="main metrics-page">
      {loadError && <p className="metrics-banner-error">{loadError}</p>}
      <SectionContainer>
        <div className="metrics-header">
          <Select
            id="votationId"
            label="Escoge una votación para ver sus métricas"
            value={selectedVotation ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedVotation(v === "" ? null : Number(v));
            }}
            options={votationOptions}
            placeholderLabel="Elige un ID"
            placeholderValue=""
            disabled={votationOptions.length === 0}
          />
        </div>
        <Table
          id="votation-summary"
          headings={["Campo", "Valor"]}
          rows={votationSummaryRows}
          rowKeys={["field", "value"]}
        />
      </SectionContainer>

      <SectionContainer>
        <h2 className="metrics-section-title">Participación y desglose</h2>
        <div className="metrics-two-cols">
          <Table
            id="participation"
            headings={["Métrica", "Valor"]}
            rows={participationRows}
            rowKeys={["metric", "value"]}
          />
          <div className="party-table-container">
            <Table
              id="votes-by-party"
              headings={["Partido", "Votos", "Escaños"]}
              rows={Object.entries(bundle?.metrics?.votesByParty ?? {}).map(
                ([pid, count]) => {
                  const seatsByParty = bundle?.metrics?.seatsByParty ?? {};
                  const hasSeatKey = Object.prototype.hasOwnProperty.call(
                    seatsByParty,
                    pid,
                  );
                  const seatVal = hasSeatKey ? seatsByParty[pid] : null;
                  return {
                    party: partyNameById[pid] || `Partido ${pid}`,
                    count,
                    seats:
                      seatVal !== null && seatVal !== undefined ? seatVal : "—",
                  };
                },
              )}
              rowKeys={["party", "count", "seats"]}
            />
          </div>
        </div>
      </SectionContainer>

      {voteMetrics && (
        <>
          <ChartSection voteMetrics={voteMetrics} />
        </>
      )}

      <SectionContainer>
        <h2 className="metrics-section-title">Detalle de votos</h2>
        {votesError ? <p className="metrics-banner-error">{votesError}</p> : null}
        {votesLoading ? <p>Cargando…</p> : null}
        <div
          className={`table-scroll-container ${votesDetailRows.length > 10 ? "scrollable" : ""}`}
        >
          <Table
            id="votes-detail"
            headings={["ID", "Partido", "Municipio", "Bloque", "TxHash", "Creado"]}
            rows={votesDetailRows}
            rowKeys={["id", "party", "municipio", "bloque", "tx", "creado"]}
          />
        </div>
        {votesTotal > PAGE_SIZE ? (
          <p style={{ margin: "0.75rem 0", fontSize: "0.9rem" }}>
            Página {votesPage} de {votesPagesTotal} — {votesTotal.toLocaleString("es-ES")} votos en total
            {" "}
            <button
              type="button"
              disabled={votesLoading || votesPage <= 1}
              onClick={() => setVotesPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            {" "}
            <button
              type="button"
              disabled={votesLoading || votesPage >= votesPagesTotal}
              onClick={() => setVotesPage((p) => p + 1)}
            >
              Siguiente
            </button>
            {" "}
            <button
              type="button"
              disabled={votesLoading}
              onClick={() => setVotesRefreshTick((t) => t + 1)}
            >
              Actualizar
            </button>
          </p>
        ) : null}
        <Select
          id="blockFilter"
          label="Filtrar votos por bloque (opcional):"
          value={selectedBlock}
          onChange={(e) => {
            setSelectedBlock(e.target.value);
            setVotesPage(1);
          }}
          options={blockOptions}
          placeholderLabel="Todos los bloques"
          placeholderValue=""
          disabled={blockOptions.length === 0}
        />
      </SectionContainer>

      <SectionContainer>
        <h2 className="metrics-section-title">Bloques (cadena en blockchain)</h2>
        {blocksError ? <p className="metrics-banner-error">{blocksError}</p> : null}
        {blocksLoading ? <p>Cargando…</p> : null}
        <div
          className={`table-scroll-container ${blocksRows.length > 10 ? "scrollable" : ""}`}
        >
          <Table
            id="blocks-chain"
            headings={["Nº", "Hash", "Hash Anterior", "Número Transacciones", "Válido", "Creado"]}
            rows={blocksRows}
            rowKeys={["num", "hash", "prev", "txs", "ok", "creado"]}
          />
        </div>
        {blocksTotal > PAGE_SIZE ? (
          <p style={{ margin: "0.75rem 0", fontSize: "0.9rem" }}>
            Página {blocksPage} de {blocksPagesTotal} — {blocksTotal.toLocaleString("es-ES")} bloques
            {" "}
            <button
              type="button"
              disabled={blocksLoading || blocksPage <= 1}
              onClick={() => setBlocksPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            {" "}
            <button
              type="button"
              disabled={blocksLoading || blocksPage >= blocksPagesTotal}
              onClick={() => setBlocksPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </p>
        ) : null}
      </SectionContainer>

      <SectionContainer>
        <h2 className="metrics-section-title">Auditoría</h2>
        {auditError ? <p className="metrics-banner-error">{auditError}</p> : null}
        {auditLoading ? <p>Cargando…</p> : null}
        <Table
          id="audit"
          headings={["ID", "Usuario", "Acción", "Descripción", "Tx Hash", "Block Hash", "Fecha"]}
          rows={auditRows}
          rowKeys={["id", "user", "action", "desc", "tx", "block", "fecha"]}
        />
        {auditTotal > PAGE_SIZE ? (
          <p style={{ margin: "0.75rem 0", fontSize: "0.9rem" }}>
            Página {auditPage} de {auditPagesTotal} — {auditTotal.toLocaleString("es-ES")} registros
            {" "}
            <button
              type="button"
              disabled={auditLoading || auditPage <= 1}
              onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            {" "}
            <button
              type="button"
              disabled={auditLoading || auditPage >= auditPagesTotal}
              onClick={() => setAuditPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </p>
        ) : null}
        <Select
          id="auditFilter"
          label="Filtrar auditoría por rol:"
          value={selectedUser}
          onChange={(e) => {
            setSelectedUser(e.target.value);
            setAuditPage(1);
          }}
          options={userRoleOptions}
          placeholderLabel="Todos los usuarios"
          placeholderValue=""
          disabled={false}
        />
      </SectionContainer>
    </main>
  );
}
