package com.agora.votations.service;

import com.agora.votations.dto.ClusterNodesSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

// Publica el estado del cluster Besu en {@code /topic/cluster/nodes}
@Service
@RequiredArgsConstructor
@Slf4j
public class ClusterNodesBroadcastService {

    private final ClusterNodesService clusterNodesService;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRateString = "${app.kubernetes.broadcast-interval-ms:5000}")
    public void broadcast() {
        try {
            ClusterNodesSnapshot snap = clusterNodesService.snapshot();
            messagingTemplate.convertAndSend("/topic/cluster/nodes", snap);
        } catch (Exception e) {
            log.debug("Broadcast cluster nodes omitido: {}", e.getMessage());
        }
    }
}