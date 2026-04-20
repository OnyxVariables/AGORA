package com.agora.votations.controller;

import com.agora.votations.dto.ClusterNodesSnapshot;
import com.agora.votations.service.ClusterNodesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cluster")
@RequiredArgsConstructor
public class ClusterAdminController {

    private final ClusterNodesService clusterNodesService;

    @GetMapping("/nodes")
    public ResponseEntity<ClusterNodesSnapshot> nodes() {
        return ResponseEntity.ok(clusterNodesService.snapshot());
    }
}