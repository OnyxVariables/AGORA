package com.agora.votations.service;

import com.agora.votations.contract.SimpleVoting;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.web3j.abi.EventEncoder;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.EthLog;
import org.web3j.protocol.core.methods.response.Log;

import java.math.BigInteger;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Escucha eventos del contrato vía {@code eth_getLogs} por bloques.
 * Besu no mantiene bien los filtros persistentes de web3j ({@code eth_newFilter} → "Logs filter not found").
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "agora.blockchain-listener.enabled", havingValue = "true", matchIfMissing = true)
public class BlockchainListenerService {

    private static final String TOPIC_VOTE_SUBMITTED =
            EventEncoder.encode(SimpleVoting.VOTESUBMITTED_EVENT);
    private static final String TOPIC_VOTATION_CREATED =
            EventEncoder.encode(SimpleVoting.VOTATIONCREATED_EVENT);
    private static final String TOPIC_VOTATION_UPDATED =
            EventEncoder.encode(SimpleVoting.VOTATIONUPDATED_EVENT);
    private static final String TOPIC_VOTATION_CANCELLED =
            EventEncoder.encode(SimpleVoting.VOTATIONCANCELLED_EVENT);
    private static final String TOPIC_VOTATION_FINISHED =
            EventEncoder.encode(SimpleVoting.VOTATIONFINISHED_EVENT);

    @Value("${blockchain.contract.address:}")
    private String contractAddress;

    @Value("${agora.blockchain-listener.start-block:-1}")
    private long configuredStartBlock;

    @Value("${agora.blockchain-listener.lookback-blocks:500}")
    private long lookbackBlocks;

    @Value("${agora.blockchain-listener.max-blocks-per-poll:2000}")
    private long maxBlocksPerPoll;

    @Value("${agora.blockchain-listener.poll-interval-ms:4000}")
    private long pollIntervalMs;

    private final Web3j web3j;
    private final VotationService votationService;
    private final VoteProcessingService voteProcessingService;
    private final DHondtCalculationService dHondtCalculationService;

    /** Último bloque ya escaneado (inclusive). */
    private final AtomicLong lastScannedBlock = new AtomicLong(-1);

    @PostConstruct
    public void init() {
        log.info("BlockchainListenerService PostConstruct");
        log.info("Contract address: '{}'", contractAddress);
        initializeScanCursor();
        log.info(
                "Escucha por eth_getLogs (Besu). Cursor bloque={}, poll cada {} ms",
                lastScannedBlock.get(),
                pollIntervalMs
        );
    }

    private void initializeScanCursor() {
        try {
            BigInteger latest = web3j.ethBlockNumber().send().getBlockNumber();
            long latestLong = latest.longValue();

            long start;
            if (configuredStartBlock >= 0) {
                start = configuredStartBlock;
            } else {
                start = Math.max(0, latestLong - lookbackBlocks);
            }
            start = Math.min(start, latestLong);

            lastScannedBlock.set(start);
            log.info("Cursor inicial en bloque {} (último en cadena: {})", start, latestLong);
        } catch (Exception e) {
            lastScannedBlock.set(0);
            log.warn("No se pudo leer eth_blockNumber; cursor en 0: {}", e.getMessage());
        }
    }

    @Scheduled(fixedDelayString = "${agora.blockchain-listener.poll-interval-ms:4000}")
    public void pollContractEvents() {
        if (contractAddress == null || contractAddress.isBlank()) {
            return;
        }

        try {
            BigInteger latest = web3j.ethBlockNumber().send().getBlockNumber();
            long latestLong = latest.longValue();
            long from = lastScannedBlock.get() + 1;

            if (from > latestLong) {
                return;
            }

            while (from <= latestLong) {
                long to = Math.min(from + maxBlocksPerPoll - 1, latestLong);
                fetchAndProcessLogs(from, to);
                lastScannedBlock.set(to);
                from = to + 1;
            }
        } catch (Exception e) {
            log.error("Error en sondeo de eventos blockchain: {}", e.getMessage(), e);
        }
    }

    private void fetchAndProcessLogs(long fromBlock, long toBlock) throws Exception {
        EthFilter filter = new EthFilter(
                DefaultBlockParameter.valueOf(BigInteger.valueOf(fromBlock)),
                DefaultBlockParameter.valueOf(BigInteger.valueOf(toBlock)),
                contractAddress
        );

        EthLog ethLog = web3j.ethGetLogs(filter).send();
        if (ethLog.hasError()) {
            throw new IllegalStateException(ethLog.getError().getMessage());
        }

        @SuppressWarnings("rawtypes")
        List<EthLog.LogResult> results = ethLog.getLogs();
        if (results == null || results.isEmpty()) {
            log.debug("Sin logs contrato bloques {}-{}", fromBlock, toBlock);
            return;
        }

        log.debug("Procesando {} logs en bloques {}-{}", results.size(), fromBlock, toBlock);

        for (EthLog.LogResult<?> result : results) {
            if (!(result.get() instanceof Log log)) {
                continue;
            }
            dispatchLog(log);
        }
    }

    private void dispatchLog(Log log) {
        List<String> topics = log.getTopics();
        if (topics == null || topics.isEmpty()) {
            return;
        }

        String topic0 = topics.get(0);
        try {
            if (TOPIC_VOTE_SUBMITTED.equals(topic0)) {
                SimpleVoting.VoteSubmittedEventResponse event =
                        SimpleVoting.getVoteSubmittedEventFromLog(log);
                log.info(
                        "VoteSubmitted (poll) voteId={}, votationId={}",
                        event.voteId,
                        event.votationId
                );
                voteProcessingService.processVoteSubmitted(event);
                return;
            }
            if (TOPIC_VOTATION_CREATED.equals(topic0)) {
                SimpleVoting.VotationCreatedEventResponse event =
                        SimpleVoting.getVotationCreatedEventFromLog(log);
                log.info("VotationCreated (poll) id={}", event.votationId);
                votationService.updateStatus(event.votationId.longValue(), "ACTIVE");
                return;
            }
            if (TOPIC_VOTATION_UPDATED.equals(topic0)) {
                SimpleVoting.VotationUpdatedEventResponse event =
                        SimpleVoting.getVotationUpdatedEventFromLog(log);
                log.info("VotationUpdated (poll) id={}", event.votationId);
                votationService.updateStatus(event.votationId.longValue(), "ACTIVE");
                return;
            }
            if (TOPIC_VOTATION_CANCELLED.equals(topic0)) {
                SimpleVoting.VotationCancelledEventResponse event =
                        SimpleVoting.getVotationCancelledEventFromLog(log);
                log.info("VotationCancelled (poll) id={}", event.votationId);
                votationService.updateStatus(event.votationId.longValue(), "CANCELLED");
                return;
            }
            if (TOPIC_VOTATION_FINISHED.equals(topic0)) {
                SimpleVoting.VotationFinishedEventResponse event =
                        SimpleVoting.getVotationFinishedEventFromLog(log);
                log.info("VotationFinished (poll) id={}", event.votationId);
                votationService.updateStatus(event.votationId.longValue(), "FINISHED");
                dHondtCalculationService.calculateAndStore(event.votationId.intValue());
            }
        } catch (Exception e) {
            log.error(
                    "Error procesando log tx={} idx={}: {}",
                    log.getTransactionHash(),
                    log.getLogIndex(),
                    e.getMessage(),
                    e
            );
        }
    }
}
