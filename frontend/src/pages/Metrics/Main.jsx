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
  metricsBundleToCsv,
  metricsBundleToHtml,
} from "../../utils/metricsExport";

export default function Main() {
  const [votationList, setVotationList] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [selectedVotation, setSelectedVotation] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [voteMetrics, setVoteMetrics] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const { partidos } = useParties();

  // Mapa de ID de partido a nombre
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
    const blocks = bundle?.blocks ?? [];
    return blocks.map((b) => ({
      value: b.hash,
      label: `Bloque ${b.blockNumber} — ${b.hash.slice(0, 10)}…`,
    }));
  }, [bundle]);

  const userRoleOptions = [
    { value: "2", label: "Ciudadano" },
    { value: "1", label: "Admin" },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(API_CONFIG.endpoints.VOTATIONS, {
          credentials: "include",
        });
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
          API_CONFIG.endpoints.METRICS_VOTATION(selectedVotation),
          { credentials: "include" },
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setBundle(data);
        setSelectedBlock("");
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
          return {
            ...prev,
            metrics: {
              ...prev.metrics,
              totalVotes: data.totalVotes,
              votesByParty: data.votesByParty || prev.metrics?.votesByParty,
            },
          };
        });
      });
    },
    [selectedVotation],
  );

  const wsUrl = import.meta.env.VITE_SPRING_WS_URL || "ws://localhost:8081/ws";
  const { isConnected: wsConnected, error: wsError } = useWebSocket(
    wsUrl,
    handleVoteReceived,
  );

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  const CopyButton = useCallback(({ text }) => {
    if (!text) return null;
    const handleCopy = () => {
      navigator.clipboard.writeText(text).then(() => {
        toastTiny("Copiado");
      }).catch(() => {});
    };
    return (
      <button
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

  const votationSummaryRows = useMemo(() => {
    if (!bundle?.votation) return [];
    const v = bundle.votation;
    return [
      {
        field: "ID",
        value: v.id,
      },
      {
        field: "Título",
        value: v.title,
      },
      {
        field: "Descripción",
        value: v.description,
      },
      {
        field: "Estado",
        value: v.state,
      },
      {
        field: "Inicio",
        value: formatDate(v.startDate),
      },
      {
        field: "Fin",
        value: formatDate(v.endDate),
      },
      {
        field: "txHash",
        value: v.txHash ? (
          <>{v.txHash.slice(0, 14)}…<CopyButton text={v.txHash} /></>
        ) : "—",
      },
    ];
  }, [bundle]);

  const participationRows = useMemo(() => {
    const m = bundle?.metrics;
    if (!m) return [];
    return [
      { metric: "Votos totales", value: m.totalVotes },
      { metric: "Ciudadanos registrados", value: m.registeredCitizens },
      { metric: "Participación (%)", value: m.participationRate },
    ];
  }, [bundle]);

  const votesDetailRows = useMemo(() => {
    const votes = bundle?.votes ?? [];
    const filtered = selectedBlock
      ? votes.filter((r) => r.blockHash === selectedBlock)
      : votes;
    return filtered.map((r) => {
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
  }, [bundle, selectedBlock]);

  const auditRows = useMemo(() => {
    let rows = bundle?.audit ?? [];
    if (selectedUser) {
      rows = rows.filter((a) => String(a.userRole) === selectedUser);
    }
    return rows.map((a) => ({
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
  }, [bundle, selectedUser]);

  const blocksRows = useMemo(() => {
    const blocks = bundle?.blocks ?? [];
    return blocks.map((b) => ({
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
  }, [bundle]);

  useEffect(() => {
    const onExport = () => {
      if (!bundle?.votation) {
        popupError("Selecciona una votación con datos cargados");
        return;
      }
      const id = bundle.votation.id;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadTextFile(
        metricsBundleToCsv(bundle),
        `agora-metricas-${id}-${stamp}.csv`,
        "text/csv;charset=utf-8",
      );
      downloadTextFile(
        metricsBundleToHtml(bundle),
        `agora-metricas-${id}-${stamp}.html`,
        "text/html;charset=utf-8",
      );
    };
    window.addEventListener("agora-export-metrics", onExport);
    return () => window.removeEventListener("agora-export-metrics", onExport);
  }, [bundle]);

  return (
    <main className="main">
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
          <div
            className={`ws-status ${isConnected ? "connected" : "disconnected"}`}
          >
            {isConnected
              ? "Tiempo real (WebSocket)"
              : wsError
                ? "Error conexión WebSocket"
                : "Conectando WebSocket…"}
          </div>
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
        <div className={`table-scroll-container ${votesDetailRows.length > 10 ? 'scrollable' : ''}`}>
          <Table
            id="votes-detail"
            headings={["ID", "Partido", "Municipio", "Bloque", "TxHash", "Creado"]}
            rows={votesDetailRows}
            rowKeys={["id", "party", "municipio", "bloque", "tx", "creado"]}
          />
        </div>
        <Select
          id="blockFilter"
          label="Filtrar votos por bloque (opcional):"
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
          options={blockOptions}
          placeholderLabel="Todos los bloques"
          placeholderValue=""
          disabled={blockOptions.length === 0}
        />
      </SectionContainer>

      <SectionContainer>
        <h2 className="metrics-section-title">Bloques (cadena en blockchain)</h2>
        <div className={`table-scroll-container ${blocksRows.length > 10 ? 'scrollable' : ''}`}>
          <Table
            id="blocks-chain"
            headings={["Nº", "Hash", "Hash Anterior", "Número Transacciones", "Válido", "Creado"]}
            rows={blocksRows}
            rowKeys={["num", "hash", "prev", "txs", "ok", "creado"]}
          />
        </div>
      </SectionContainer>

      <SectionContainer>
        <h2 className="metrics-section-title">Auditoría</h2>
        <Table
          id="audit"
          headings={["ID", "Usuario", "Acción", "Descripción", "Tx Hash", "Block Hash", "Fecha"]}
          rows={auditRows}
          rowKeys={["id", "user", "action", "desc", "tx", "block", "fecha"]}
        />
        <Select
          id="auditFilter"
          label="Filtrar auditoría por rol:"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          options={userRoleOptions}
          placeholderLabel="Todos los usuarios"
          placeholderValue=""
          disabled={false}
        />
      </SectionContainer>
    </main>
  );
}