package com.agora.votations.service;

import com.agora.votations.dto.VoteMessage;
import com.agora.votations.entity.VoteEntity;
import com.agora.votations.repository.VoteEntityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para transmitir votos en tiempo real via WebSocket STOMP.
 * 
 * Se integra con VoteProcessingService para emitir actualizaciones
 * a todos los clientes conectados a /topic/votes cuando se procesa
 * un nuevo voto desde el blockchain.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VoteWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final VoteEntityRepository voteRepository;

    /**
     * Emite un mensaje de voto recien insertado en BD
     * Se llama desde VoteProcessingService tras guardar el voto en BD.
     * @param vote Entidad del voto recien guardado
     */
    public void broadcastVote(VoteEntity vote) {
        try {
            var allVotes = voteRepository.findByVotationId(vote.getVotationId());
            
            long totalVotes = allVotes.size();
            
            Map<Integer, Long> votesByParty = allVotes.stream()
                    .collect(Collectors.groupingBy(
                            VoteEntity::getPartyId,
                            Collectors.counting()
                    ));
            
            Map<Integer, Long> votesByMunicipality = allVotes.stream()
                    .collect(Collectors.groupingBy(
                            VoteEntity::getMunicipalityId,
                            Collectors.counting()
                    ));

            VoteMessage message = VoteMessage.builder()
                    .votationId(vote.getVotationId())
                    .partyId(vote.getPartyId())
                    .municipalityId(vote.getMunicipalityId())
                    .voteHash(vote.getVoteHash())
                    .txHash(vote.getTxHash())
                    .timestamp(Instant.now())
                    .totalVotes(totalVotes)
                    .votesByParty(votesByParty)
                    .votesByMunicipality(votesByMunicipality)
                    .build();

            // Enviar a /topic/votes - admin recibe mensaje
            messagingTemplate.convertAndSend("/topic/votes", message);
            
            log.info("WebSocket: Voto broadcasteado - votationId={}, totalVotes={}", 
                    vote.getVotationId(), totalVotes);
                    
        } catch (Exception e) {
            log.error("Error broadcasteando voto via WebSocket: {}", e.getMessage(), e);
        }
    }

    // Obtiene el estado actual de votos para una votacion.
    public VoteMessage getCurrentState(Integer votationId) {
        var allVotes = voteRepository.findByVotationId(votationId);
        
        if (allVotes.isEmpty()) {
            return null;
        }

        Map<Integer, Long> votesByParty = allVotes.stream()
                .collect(Collectors.groupingBy(
                        VoteEntity::getPartyId,
                        Collectors.counting()
                ));

        Map<Integer, Long> votesByMunicipality = allVotes.stream()
                .collect(Collectors.groupingBy(
                        VoteEntity::getMunicipalityId,
                        Collectors.counting()
                ));

        return VoteMessage.builder()
                .votationId(votationId)
                .timestamp(Instant.now())
                .totalVotes((long) allVotes.size())
                .votesByParty(votesByParty)
                .votesByMunicipality(votesByMunicipality)
                .build();
    }
}