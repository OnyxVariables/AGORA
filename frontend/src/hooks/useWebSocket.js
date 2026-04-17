import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Hook para conectar a WebSocket STOMP de Spring Boot.
 * 
 * Recibe actualizaciones en tiempo real de votos cuando
 * Spring Boot procesa un nuevo voto desde el blockchain.
 * 
 * @param {string} url - URL del endpoint WebSocket (ej: ws://localhost:8081/ws)
 * @param {function} onVoteReceived - Callback cuando llega un nuevo voto
 * @param {number} reconnectDelay - Tiempo entre reintentos de conexion (ms)
 */
export function useWebSocket(url, onVoteReceived, reconnectDelay = 5000) {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    if (clientRef.current?.active) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(url.replace('ws://', 'http://').replace('wss://', 'https://')),
      reconnectDelay: reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('[WebSocket] Conectado a STOMP');
        setIsConnected(true);
        setError(null);
        
        // Suscribirse al topic de votos
        client.subscribe('/topic/votes', (message) => {
          try {
            const voteData = JSON.parse(message.body);
            console.log('[WebSocket] Voto recibido:', voteData);
            onVoteReceived(voteData);
          } catch (err) {
            console.error('[WebSocket] Error parseando mensaje:', err);
          }
        });
      },
      
      onDisconnect: () => {
        console.log('[WebSocket] Desconectado');
        setIsConnected(false);
      },
      
      onStompError: (frame) => {
        console.error('[WebSocket] Error STOMP:', frame.headers['message']);
        setError(frame.headers['message']);
        setIsConnected(false);
      },
      
      onWebSocketError: (event) => {
        console.error('[WebSocket] Error de conexion:', event);
        setError('Error de conexion WebSocket');
        setIsConnected(false);
      }
    });

    clientRef.current = client;
    client.activate();
  }, [url, onVoteReceived, reconnectDelay]);

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

// Hook para obtener el estado inicial de votos via REST API.
// Se usa al cargar la pagina antes de que lleguen actualizaciones WS.
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
        // Llamo al endpoint REST de Laravel para obtener datos historicos
        const response = await fetch(`/api/votes/metrics/${votationId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Error cargando metricas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [votationId]);

  return { metrics, loading, error, setMetrics };
}