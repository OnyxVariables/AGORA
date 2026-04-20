import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * STOMP sobre SockJS. Soporta varios topics y callback legacy (onVoteReceived, reconnectDelay).
 *
 * @param {string} url - ej. ws://localhost:8081/ws
 * @param {object|function} options - Si es función, se trata como onVoteReceived (API antigua).
 * @param {number} [legacyReconnectDelay] - Solo con API antigua: tercer argumento.
 */
export function useWebSocket(url, options, legacyReconnectDelay = 5000) {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const isLegacyFn = typeof options === "function";
  const onVoteReceived = isLegacyFn ? options : options?.onVoteReceived;
  const onClusterNodes = isLegacyFn ? undefined : options?.onClusterNodes;
  const reconnectDelay = isLegacyFn
    ? legacyReconnectDelay
    : (options?.reconnectDelay ?? 5000);

  const voteCbRef = useRef(onVoteReceived);
  const clusterCbRef = useRef(onClusterNodes);
  voteCbRef.current = onVoteReceived;
  clusterCbRef.current = onClusterNodes;

  const connect = useCallback(() => {
    if (clientRef.current?.active) {
      return;
    }

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(url.replace("ws://", "http://").replace("wss://", "https://")),
      reconnectDelay: reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setIsConnected(true);
        setError(null);

        if (voteCbRef.current) {
          client.subscribe("/topic/votes", (message) => {
            try {
              const voteData = JSON.parse(message.body);
              voteCbRef.current?.(voteData);
            } catch (err) {
              console.error("[WebSocket] Error parseando voto:", err);
            }
          });
        }

        if (clusterCbRef.current) {
          client.subscribe("/topic/cluster/nodes", (message) => {
            try {
              const payload = JSON.parse(message.body);
              clusterCbRef.current?.(payload);
            } catch (err) {
              console.error("[WebSocket] Error parseando cluster:", err);
            }
          });
        }
      },

      onDisconnect: () => {
        setIsConnected(false);
      },

      onStompError: (frame) => {
        console.error("[WebSocket] Error STOMP:", frame.headers["message"]);
        setError(frame.headers["message"]);
        setIsConnected(false);
      },

      onWebSocketError: (event) => {
        console.error("[WebSocket] Error de conexion:", event);
        setError("Error de conexion WebSocket");
        setIsConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();
  }, [url, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected, error, reconnect: connect };
}

export function useVoteMetrics(votationId) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!votationId) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/votes/metrics/${votationId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error("Error cargando metricas:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [votationId]);

  return { metrics, loading, error, setMetrics };
}