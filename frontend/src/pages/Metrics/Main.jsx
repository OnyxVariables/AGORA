import { useCallback, useEffect, useMemo, useState } from "react";

import "./Main.css";
import SectionContainer from "../../components/SectionContainer/SectionContainer";
import Select from "../../components/Select/Select";
import Table from "../../components/Table/Table";
import ChartSection from "../../components/ChartSection/ChartSection";
import { useWebSocket } from "../../hooks/useWebSocket";
import { API_CONFIG } from "../../config/api";
import { popupError } from "../../services/alerts";
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
  const [selectedParty, setSelectedParty] = useState("");
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

  const partyOptions = useMemo(() => {
    const partyVotes = bundle?.metrics?.votesByParty ?? {};
    return Object.entries(partyVotes).map(([pid, count]) => ({
      value: pid,
      label: `${partyNameById[pid] || `Partido ${pid}`} (${count} votos)`,
    }));
  }, [bundle, partyNameById]);

  const userOptions = useMemo(() => {
    const audit = bundle?.audit ?? [];
    const uniqueUsers = [...new Set(audit.map((a) => a.userId))];
    return uniqueUsers.map((uid) => ({
      value: String(uid),
      label: `Usuario ${uid}`,
    }));
  }, [bundle]);

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

  const handleVoteReceived = useCallback(
    (voteData) => {
      if (voteData.votationId !== selectedVotation) return;
      setVoteMetrics({
        votationId: voteData.votationId,
        totalVotes: voteData.totalVotes,
        votesByParty: voteData.votesByParty || {},
        votesByMunicipality: voteData.votesByMunicipality || {},
        votesByProvinceName: voteData.votesByProvinceName || {},
        timestamp: voteData.timestamp,
      });
      setBundle((prev) => {
        if (!prev || prev.votation?.id !== voteData.votationId) return prev;
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            totalVotes: voteData.totalVotes,
            votesByParty: voteData.votesByParty || prev.metrics?.votesByParty,
          },
        };
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

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
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
        value: v.txHash ? `${v.txHash.slice(0, 14)}…` : "—",
      },
    ];
  }, [bundle, formatDate]);

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
    return filtered.map((r) => ({
      id: r.id,
      party: r.partyName,
      municipio: r.municipalityId,
      bloque: r.blockHash ? `${r.blockHash.slice(0, 10)}…` : "—",
      tx: r.txHash ? `${r.txHash.slice(0, 10)}…` : "—",
    }));
  }, [bundle, selectedBlock]);

  const auditRows = useMemo(() => {
    let rows = bundle?.audit ?? [];
    if (selectedUser) {
      rows = rows.filter((a) => String(a.userId) === selectedUser);
    }
    return rows.map((a) => ({
      id: a.id,
      user: a.userId,
      action: a.action,
      desc: a.description ? `${String(a.description).slice(0, 60)}…` : "—",
      tx: a.txHash ? `${a.txHash.slice(0, 12)}…` : "—",
      block: a.blockHash ? `${a.blockHash.slice(0, 12)}…` : "—",
      fecha: formatDate(a.createdAt),
    }));
  }, [bundle, selectedUser, formatDate]);

  const blocksRows = useMemo(() => {
    const blocks = bundle?.blocks ?? [];
    return blocks.map((b) => ({
      num: b.blockNumber,
      hash: `${b.hash.slice(0, 12)}…`,
      prev: b.previousHash ? `${b.previousHash.slice(0, 10)}…` : "—",
      txs: b.transactions,
      ok: b.isValid ? "Sí" : "No",
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

      {voteMetrics && (
        <>
          <ChartSection
            voteMetrics={voteMetrics}
            selectedVotation={selectedVotation}
          />
        </>
      )}

      <SectionContainer>
        <h2 className="metrics-section-title">Participación y desglose</h2>
        <Table
          id="participation"
          headings={["Métrica", "Valor"]}
          rows={participationRows}
          rowKeys={["metric", "value"]}
        />
        <Table
          id="votes-by-party"
          headings={["Partido", "Votos"]} //Meter escaños también
          rows={Object.entries(bundle?.metrics?.votesByParty ?? {}).map(
            ([pid, count]) => ({
              party: partyNameById[pid] || `Partido ${pid}`,
              count,
            }),
          )}
          rowKeys={["party", "count"]}
        />
      </SectionContainer>

      <SectionContainer>
        <h2 className="metrics-section-title">Detalle de votos</h2>
        <Table
          id="votes-detail"
          headings={["ID", "Partido", "Municipio", "Bloque", "Tx"]}
          rows={votesDetailRows}
          rowKeys={["id", "party", "municipio", "bloque", "tx"]}
        />
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
        <Table
          id="blocks-chain"
          headings={["Nº", "Hash", "Anterior", "Txs", "Válido"]}
          rows={blocksRows}
          rowKeys={["num", "hash", "prev", "txs", "ok"]}
        />
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
          label="Filtrar auditoría por usuario (opcional):"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          options={userOptions}
          placeholderLabel="Todos los usuarios"
          placeholderValue=""
          disabled={userOptions.length === 0}
        />
      </SectionContainer>
    </main>
  );
}
