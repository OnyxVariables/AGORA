package com.agora.votations.config;

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
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // En produccion, restringir al dominio del frontend
                .withSockJS();
    }
}
