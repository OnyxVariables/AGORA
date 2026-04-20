package com.agora.votations.service;

import com.agora.votations.dto.ClusterNodeView;
import com.agora.votations.dto.ClusterNodesSnapshot;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodCondition;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

// Estado de pods Besu en Kubernetes frente a {@code cluster/static-nodes.json}
@Service
@RequiredArgsConstructor
@Slf4j
public class ClusterNodesService {

    private final ObjectMapper objectMapper;

    @Value("${app.kubernetes.enabled:false}")
    private boolean kubernetesEnabled;

    @Value("${app.kubernetes.namespace:default}")
    private String namespace;

    @Value("${app.kubernetes.pod-label-key:app}")
    private String podLabelKey;

    @Value("${app.kubernetes.pod-label-value:besu-node}")
    private String podLabelValue;

    public ClusterNodesSnapshot snapshot() {
        if (!kubernetesEnabled) {
            return ClusterNodesSnapshot.disabled(
                    "Integración Kubernetes desactivada (app.kubernetes.enabled=false).");
        }
        Set<String> expectedPodNames;
        try {
            expectedPodNames = loadExpectedPodNamesFromStaticNodes();
        } catch (IOException e) {
            log.warn("No se pudo leer static-nodes.json: {}", e.getMessage());
            return ClusterNodesSnapshot.disabled("No se pudo leer static-nodes.json: " + e.getMessage());
        }

        try (KubernetesClient client = new KubernetesClientBuilder().build()) {
            List<Pod> pods = client.pods()
                    .inNamespace(namespace)
                    .withLabel(podLabelKey, podLabelValue)
                    .list()
                    .getItems();

            List<ClusterNodeView> active = new ArrayList<>();
            List<ClusterNodeView> down = new ArrayList<>();
            List<ClusterNodeView> unexpected = new ArrayList<>();
            Set<String> seenExpected = new HashSet<>();

            for (Pod pod : pods) {
                if (pod.getMetadata() == null) {
                    continue;
                }
                String name = pod.getMetadata().getName();
                String nameLower = name.toLowerCase(Locale.ROOT);
                boolean expected = expectedPodNames.stream()
                        .anyMatch(e -> e.equalsIgnoreCase(name));
                boolean ready = isPodReady(pod);
                ClusterNodeView view = toView(pod, expected);

                if (!expected) {
                    unexpected.add(view);
                    continue;
                }
                seenExpected.add(nameLower);
                if (ready) {
                    active.add(view);
                } else {
                    down.add(view);
                }
            }

            for (String expectedName : expectedPodNames) {
                boolean seen = pods.stream()
                        .anyMatch(p -> p.getMetadata() != null
                                && expectedName.equalsIgnoreCase(p.getMetadata().getName()));
                if (!seen) {
                    down.add(ClusterNodeView.builder()
                            .podName(expectedName)
                            .phase("Missing")
                            .ready(false)
                            .podIp("")
                            .restartCount(0)
                            .expectedInStaticConfig(true)
                            .build());
                }
            }

            return ClusterNodesSnapshot.builder()
                    .kubernetesIntegrationEnabled(true)
                    .message("OK")
                    .generatedAt(Instant.now())
                    .active(active)
                    .down(down)
                    .unexpected(unexpected)
                    .build();
        } catch (Exception e) {
            log.error("Error consultando Kubernetes: {}", e.getMessage(), e);
            return ClusterNodesSnapshot.disabled("Error Kubernetes: " + e.getMessage());
        }
    }

    private ClusterNodeView toView(Pod pod, boolean expectedInStatic) {
        String name = pod.getMetadata() != null ? pod.getMetadata().getName() : "?";
        String phase = pod.getStatus() != null ? pod.getStatus().getPhase() : "?";
        String ip = pod.getStatus() != null && pod.getStatus().getPodIP() != null
                ? pod.getStatus().getPodIP()
                : "";
        int restarts = sumRestarts(pod);
        return ClusterNodeView.builder()
                .podName(name)
                .phase(phase)
                .ready(isPodReady(pod))
                .podIp(ip)
                .restartCount(restarts)
                .expectedInStaticConfig(expectedInStatic)
                .build();
    }

    private static int sumRestarts(Pod p) {
        int r = 0;
        if (p.getStatus() != null && p.getStatus().getContainerStatuses() != null) {
            for (var cs : p.getStatus().getContainerStatuses()) {
                r += cs.getRestartCount() != null ? cs.getRestartCount() : 0;
            }
        }
        return r;
    }

    private static boolean isPodReady(Pod pod) {
        if (pod.getStatus() == null || pod.getStatus().getConditions() == null) {
            return false;
        }
        for (PodCondition c : pod.getStatus().getConditions()) {
            if ("Ready".equals(c.getType()) && "True".equalsIgnoreCase(c.getStatus())) {
                return true;
            }
        }
        return false;
    }

    Set<String> loadExpectedPodNamesFromStaticNodes() throws IOException {
        ClassPathResource res = new ClassPathResource("cluster/static-nodes.json");
        try (InputStream in = res.getInputStream()) {
            List<String> enodes = objectMapper.readValue(in, new TypeReference<>() {
            });
            Set<String> names = new HashSet<>();
            for (String enode : enodes) {
                int at = enode.indexOf('@');
                if (at < 0 || at + 1 >= enode.length()) {
                    continue;
                }
                String hostPort = enode.substring(at + 1);
                int colon = hostPort.indexOf(':');
                String host = colon > 0 ? hostPort.substring(0, colon) : hostPort;
                int dot = host.indexOf('.');
                String podName = dot > 0 ? host.substring(0, dot) : host;
                names.add(podName);
            }
            return names;
        }
    }
}