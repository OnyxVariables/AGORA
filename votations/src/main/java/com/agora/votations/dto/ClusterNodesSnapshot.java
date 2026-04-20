package com.agora.votations.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClusterNodesSnapshot {
    private boolean kubernetesIntegrationEnabled;
    private String message;
    private Instant generatedAt;
    private List<ClusterNodeView> active;
    private List<ClusterNodeView> down;
    // Pods no listados en static-nodes (réplicas extra o nombres distintos)
    private List<ClusterNodeView> unexpected;

    public static ClusterNodesSnapshot disabled(String reason) {
        return ClusterNodesSnapshot.builder()
                .kubernetesIntegrationEnabled(false)
                .message(reason)
                .generatedAt(Instant.now())
                .active(Collections.emptyList())
                .down(Collections.emptyList())
                .unexpected(Collections.emptyList())
                .build();
    }
}