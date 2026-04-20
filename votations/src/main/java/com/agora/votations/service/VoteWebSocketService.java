package com.agora.votations.service;

import com.agora.votations.dto.VoteMessage;
import com.agora.votations.entity.Municipality;
import com.agora.votations.entity.Province;
import com.agora.votations.entity.VoteEntity;
import com.agora.votations.repository.MunicipalityRepository;
import com.agora.votations.repository.ProvinceRepository;
import com.agora.votations.repository.VoteEntityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Transmite snapshots de votos en tiempo real vía WebSocket STOMP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VoteWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final VoteEntityRepository voteRepository;
    private final MunicipalityRepository municipalityRepository;
    private final ProvinceRepository provinceRepository;

    /**
     * Emite el estado agregado actual para una votación (llamado desde {@link VoteAggregator}).
     */
    public void broadcastSnapshot(Integer votationId, VoteEntity lastVote) {
        try {
            List<VoteEntity> allVotes = voteRepository.findByVotationId(votationId);
            if (allVotes.isEmpty()) {
                return;
            }
            VoteMessage message = buildMessage(lastVote, allVotes);
            messagingTemplate.convertAndSend("/topic/votes", message);
            log.debug("WebSocket: snapshot votationId={}, totalVotes={}", votationId, message.getTotalVotes());
        } catch (Exception e) {
            log.error("Error broadcasteando snapshot via WebSocket: {}", e.getMessage(), e);
        }
    }

    private VoteMessage buildMessage(VoteEntity lastVote, List<VoteEntity> allVotes) {
        long totalVotes = allVotes.size();

        Map<Integer, Long> votesByParty = allVotes.stream()
                .collect(Collectors.groupingBy(VoteEntity::getPartyId, Collectors.counting()));

        Map<Integer, Long> votesByMunicipality = allVotes.stream()
                .collect(Collectors.groupingBy(VoteEntity::getMunicipalityId, Collectors.counting()));

        Map<String, Long> votesByProvinceName = computeVotesByProvinceName(allVotes);

        return VoteMessage.builder()
                .votationId(lastVote.getVotationId())
                .partyId(lastVote.getPartyId())
                .municipalityId(lastVote.getMunicipalityId())
                .voteHash(lastVote.getVoteHash())
                .txHash(lastVote.getTxHash())
                .timestamp(Instant.now())
                .totalVotes(totalVotes)
                .votesByParty(votesByParty)
                .votesByMunicipality(votesByMunicipality)
                .votesByProvinceName(votesByProvinceName)
                .build();
    }

    private Map<String, Long> computeVotesByProvinceName(List<VoteEntity> allVotes) {
        Set<Integer> muniIds = allVotes.stream()
                .map(VoteEntity::getMunicipalityId)
                .collect(Collectors.toSet());
        if (muniIds.isEmpty()) {
            return Map.of();
        }
        List<Municipality> munis = municipalityRepository.findByIdIn(muniIds);
        Map<Integer, Integer> muniToProvinceId = munis.stream()
                .collect(Collectors.toMap(Municipality::getId, Municipality::getProvinceId, (a, b) -> a));
        Set<Integer> provinceIds = munis.stream()
                .map(Municipality::getProvinceId)
                .collect(Collectors.toSet());
        List<Province> provinces = provinceRepository.findAllById(provinceIds);
        Map<Integer, String> provinceIdToName = provinces.stream()
                .collect(Collectors.toMap(Province::getId, Province::getName, (a, b) -> a));

        Map<String, Long> byName = new HashMap<>();
        for (VoteEntity v : allVotes) {
            Integer pid = muniToProvinceId.get(v.getMunicipalityId());
            if (pid == null) {
                continue;
            }
            String name = provinceIdToName.get(pid);
            if (name == null || name.isBlank()) {
                continue;
            }
            byName.merge(name, 1L, Long::sum);
        }
        return byName;
    }

    public VoteMessage getCurrentState(Integer votationId) {
        List<VoteEntity> allVotes = voteRepository.findByVotationId(votationId);

        if (allVotes.isEmpty()) {
            return null;
        }
        VoteEntity last = allVotes.get(allVotes.size() - 1);

        Map<Integer, Long> votesByParty = allVotes.stream()
                .collect(Collectors.groupingBy(VoteEntity::getPartyId, Collectors.counting()));

        Map<Integer, Long> votesByMunicipality = allVotes.stream()
                .collect(Collectors.groupingBy(VoteEntity::getMunicipalityId, Collectors.counting()));

        Map<String, Long> votesByProvinceName = computeVotesByProvinceName(allVotes);

        return VoteMessage.builder()
                .votationId(votationId)
                .partyId(last.getPartyId())
                .municipalityId(last.getMunicipalityId())
                .timestamp(Instant.now())
                .totalVotes((long) allVotes.size())
                .votesByParty(votesByParty)
                .votesByMunicipality(votesByMunicipality)
                .votesByProvinceName(votesByProvinceName)
                .build();
    }
}