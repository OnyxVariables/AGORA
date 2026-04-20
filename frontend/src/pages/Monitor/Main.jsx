import { useCallback, useEffect, useState } from "react";

import { API_CONFIG, SPRING_HTTP_BASE } from "../../config/api";
import { useWebSocket } from "../../hooks/useWebSocket";

import "./Main.css";

const ADMIN_TOKEN = import.meta.env.VITE_VOTATIONS_ADMIN_TOKEN || "";

function buildSpringHeaders() {
  const h = { Accept: "application/json" };
  if (ADMIN_TOKEN) {
    h["X-Admin-Token"] = ADMIN_TOKEN;
  }
  return h;
}

function ServiceCard({ title, status, latencyMs, detail, lastAt }) {
  const badge =
    status === "ok" ? "ok" : status === "degraded" ? "degraded" : "down";
  return (
    <article className="monitor-card">
      <div className="monitor-card-header">
        <span className="monitor-card-title">{title}</span>
        <span className={`monitor-badge monitor-badge--${badge}`}>{status}</span>
      </div>
      {latencyMs != null && (
        <div className="monitor-meta">Latencia: {Math.round(latencyMs)} ms</div>
      )}
      {detail && <div className="monitor-meta">{detail}</div>}
      {lastAt && (
        <div className="monitor-meta">Última comprobación: {lastAt}</div>
      )}
    </article>
  );
}

export default function Main() {
  const [checks, setChecks] = useState({});
  const [clusterSnap, setClusterSnap] = useState(null);

  const wsUrl = import.meta.env.VITE_SPRING_WS_URL || "ws://localhost:8081/ws";

  const onClusterNodes = useCallback((payload) => {
    setClusterSnap(payload);
  }, []);

  const { isConnected: wsConnected } = useWebSocket(wsUrl, {
    onClusterNodes,
    reconnectDelay: 5000,
  });

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const next = {};

      const touch = async (key, fn) => {
        const s = performance.now();
        try {
          await fn();
          next[key] = {
            status: "ok",
            latencyMs: performance.now() - s,
            lastAt: new Date().toISOString(),
          };
        } catch (e) {
          next[key] = {
            status: "down",
            detail: e?.message || String(e),
            lastAt: new Date().toISOString(),
          };
        }
      };

      await touch("laravel", async () => {
        const r = await fetch(`${API_CONFIG.baseURL}/up`, {
          credentials: "include",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      });

      await touch("database", async () => {
        const r = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.ADMIN_HEALTH_DB}`,
          { credentials: "include" },
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      });

      await touch("blockchain", async () => {
        const r = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.ADMIN_HEALTH_BLOCKCHAIN}`,
          { credentials: "include" },
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      });

      await touch("spring", async () => {
        const r = await fetch(`${SPRING_HTTP_BASE}/actuator/health`, {
          headers: buildSpringHeaders(),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      });

      try {
        const s = performance.now();
        const r = await fetch(`${SPRING_HTTP_BASE}/api/admin/cluster/nodes`, {
          headers: buildSpringHeaders(),
        });
        const lat = performance.now() - s;
        if (r.ok) {
          const data = await r.json();
          if (!cancelled) {
            setClusterSnap(data);
            next.clusterRest = {
              status: "ok",
              latencyMs: lat,
              lastAt: new Date().toISOString(),
            };
          }
        } else {
          next.clusterRest = {
            status: "down",
            detail: `HTTP ${r.status}`,
            lastAt: new Date().toISOString(),
          };
        }
      } catch (e) {
        next.clusterRest = {
          status: "down",
          detail: e?.message || String(e),
          lastAt: new Date().toISOString(),
        };
      }

      if (!cancelled) {
        setChecks(next);
      }
    };

    poll();
    const id = setInterval(poll, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const wsStatus = wsConnected ? "ok" : "down";
  const k8sEnabled = clusterSnap?.kubernetesIntegrationEnabled;

  return (
    <main className="monitor-page">
      <div className="monitor-grid">
        <ServiceCard
          title="Laravel (/up)"
          status={checks.laravel?.status || "degraded"}
          latencyMs={checks.laravel?.latencyMs}
          detail={checks.laravel?.detail}
          lastAt={checks.laravel?.lastAt}
        />
        <ServiceCard
          title="MariaDB (API)"
          status={checks.database?.status || "degraded"}
          latencyMs={checks.database?.latencyMs}
          detail={checks.database?.detail}
          lastAt={checks.database?.lastAt}
        />
        <ServiceCard
          title="Blockchain RPC"
          status={checks.blockchain?.status || "degraded"}
          latencyMs={checks.blockchain?.latencyMs}
          detail={checks.blockchain?.detail}
          lastAt={checks.blockchain?.lastAt}
        />
        <ServiceCard
          title="Spring Boot (actuator)"
          status={checks.spring?.status || "degraded"}
          latencyMs={checks.spring?.latencyMs}
          detail={checks.spring?.detail}
          lastAt={checks.spring?.lastAt}
        />
        <ServiceCard
          title="WebSocket STOMP (votaciones)"
          status={wsStatus}
          detail={wsConnected ? "Conectado a /ws" : "Sin conexión"}
          lastAt={new Date().toISOString()}
        />
        <ServiceCard
          title="API cluster K8s (REST)"
          status={checks.clusterRest?.status || "degraded"}
          latencyMs={checks.clusterRest?.latencyMs}
          detail={checks.clusterRest?.detail}
          lastAt={checks.clusterRest?.lastAt}
        />
      </div>

      <section className="monitor-cluster">
        <h3>Nodos Besu (Kubernetes)</h3>
        {!k8sEnabled && (
          <p className="monitor-meta">
            {clusterSnap?.message ||
              "Sin datos de cluster. Activa KUBERNETES_ENABLED en Spring y configura kubeconfig o ServiceAccount."}
          </p>
        )}
        {k8sEnabled && clusterSnap && (
          <div className="monitor-node-lists">
            <div className="monitor-node-list">
              <h4>Activos (Ready)</h4>
              <ul>
                {(clusterSnap.active || []).map((n) => (
                  <li key={n.podName}>
                    {n.podName} — {n.podIp || "?"}{" "}
                    <small>(restarts {n.restartCount})</small>
                  </li>
                ))}
                {(clusterSnap.active || []).length === 0 && <li>Ninguno</li>}
              </ul>
            </div>
            <div className="monitor-node-list">
              <h4>Caídos / no listos</h4>
              <ul>
                {(clusterSnap.down || []).map((n) => (
                  <li key={n.podName}>
                    {n.podName} — {n.phase}
                  </li>
                ))}
                {(clusterSnap.down || []).length === 0 && <li>Ninguno</li>}
              </ul>
            </div>
            <div className="monitor-node-list">
              <h4>No declarados (nuevos)</h4>
              <ul>
                {(clusterSnap.unexpected || []).map((n) => (
                  <li key={n.podName}>
                    {n.podName} — {n.phase}
                  </li>
                ))}
                {(clusterSnap.unexpected || []).length === 0 && <li>Ninguno</li>}
              </ul>
            </div>
          </div>
        )}
        {clusterSnap?.generatedAt && (
          <p className="monitor-refresh">
            Snapshot: {clusterSnap.generatedAt}
          </p>
        )}
      </section>
    </main>
  );
}