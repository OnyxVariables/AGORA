package com.agora.votations.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClusterNodeView {
    private String podName;
    private String phase;
    private boolean ready;
    private String podIp;
    private int restartCount;
    // Declarado en static-nodes.json (parte host del enode)
    private boolean expectedInStaticConfig;
}