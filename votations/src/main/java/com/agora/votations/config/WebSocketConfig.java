package com.agora.votations.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuracion WebSocket con STOMP para transmision en tiempo real de votos.
 * 
 * STOMP (Simple Text Oriented Messaging Protocol) es un protocolo de mensajeria
 * ligero similar a HTTP pero para mensajes. Permite:
 * - Publicar/Suscribirse a topics (pub/sub)
 * - Comunicacion bidireccional cliente-servidor
 * - Compatibilidad con SockJS para navegadores antiguos
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.websocket.allowed-origin-patterns:http://localhost:*,https://localhost:*}")
    private String allowedOriginPatternsRaw;

    /**
     * Configura el broker de mensajes (donde se almacenan y distribuyen).
     * /topic: para mensajes de broadcast (todos los clientes reciben)
     * /queue: para mensajes punto a punto
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Registra el endpoint donde los clientes se conectan.
     * SockJS habilita fallback para navegadores que no soportan WebSocket nativo.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] patterns = Arrays.stream(allowedOriginPatternsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(patterns)
                .withSockJS();
    }
}