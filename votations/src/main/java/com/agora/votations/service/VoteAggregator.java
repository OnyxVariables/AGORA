package com.agora.votations.service;

import com.agora.votations.entity.VoteEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

// Coalescencia de broadcasts WebSocket: evita un mensaje STOMP por voto
// (causa lag en el cliente con picos de tráfico)
@Service
@RequiredArgsConstructor
@Slf4j
public class VoteAggregator {

    private final VoteWebSocketService voteWebSocketService;

    private final ConcurrentHashMap<Integer, VoteEntity> pendingByVotation = new ConcurrentHashMap<>();
    private final AtomicInteger eventsSinceFlush = new AtomicInteger(0);

    @Value("${app.ws.flush-batch-size:500}")
    private int flushBatchSize;

    public synchronized void enqueue(VoteEntity vote) {
        pendingByVotation.put(vote.getVotationId(), vote);
        int n = eventsSinceFlush.incrementAndGet();
        if (n >= flushBatchSize) {
            flush();
        }
    }

    @Scheduled(fixedDelayString = "${app.ws.flush-interval-ms:250}")
    public synchronized void scheduledFlush() {
        if (!pendingByVotation.isEmpty()) {
            flush();
        }
    }

    private void flush() {
        if (pendingByVotation.isEmpty()) {
            eventsSinceFlush.set(0);
            return;
        }
        eventsSinceFlush.set(0);
        Map<Integer, VoteEntity> snapshot = Map.copyOf(pendingByVotation);
        pendingByVotation.clear();
        snapshot.forEach((votationId, lastVote) ->
                voteWebSocketService.broadcastSnapshot(votationId, lastVote));
    }
}