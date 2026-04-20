package com.agora.votations.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * DTO para transmision en tiempo real de votos via WebSocket.
 * Se envia a todos los clientes suscritos a /topic/votes cuando
 * Spring Boot procesa un nuevo voto del blockchain.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoteMessage {
    private Integer votationId;
    private Integer partyId;
    private Integer municipalityId;
    private String voteHash;
    private String txHash;
    private Instant timestamp;
    private Long totalVotes;
    private Map<Integer, Long> votesByParty;
    private Map<Integer, Long> votesByMunicipality;
    // Conteo por nombre de provincia (mismo criterio que Laravel metrics)
    private Map<String, Long> votesByProvinceName;
}