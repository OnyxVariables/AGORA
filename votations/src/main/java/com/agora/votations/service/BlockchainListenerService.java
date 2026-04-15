package com.agora.votations.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.web3j.protocol.Web3j;
import org.web3j.tx.ReadonlyTransactionManager;
import org.web3j.tx.gas.StaticGasProvider;

import com.agora.votations.contract.SimpleVoting;

import java.math.BigInteger;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "agora.blockchain-listener.enabled", havingValue = "true", matchIfMissing = true)
public class BlockchainListenerService {

    @Value("${blockchain.contract.address:}")
    private String contractAddress;

    private final Web3j web3j;
    private final VotationService votationService;
    private final VoteProcessingService voteProcessingService;

    @PostConstruct
    public void init() {
        log.info("BlockchainListenerService PostConstruct");
        log.info("Contract address: '{}'", contractAddress);
        startListening();
    }

    public void startListening() {
        log.info("Iniciando escucha de eventos...");

        try {
            // Usar StaticGasProvider con valores apropiados para red local
            StaticGasProvider gasProvider = new StaticGasProvider(
                    BigInteger.valueOf(0),  // gas price 0 para hardhat
                    BigInteger.valueOf(3000000)  // gas limit
            );

            // ReadonlyTransactionManager para operaciones de solo lectura (escuchar eventos)
            ReadonlyTransactionManager txManager = new ReadonlyTransactionManager(web3j, contractAddress);

            SimpleVoting contract = SimpleVoting.load(
                    contractAddress,
                    web3j,
                    txManager,
                    gasProvider
            );

            log.info("Contrato cargado correctamente. Escuchando eventos desde el bloque 0...");

            listenVoteSubmitted(contract);
            listenVotationCreated(contract);
            listenVotationUpdated(contract);
            listenVotationCancelled(contract);
            listenVotationFinished(contract);

            log.info("Listener de eventos blockchain iniciado correctamente");

        } catch (Exception e) {
            log.error("Error al iniciar listener de blockchain: {}", e.getMessage(), e);
            e.printStackTrace();
        }
    }

    // EVENTOS
    private void listenVoteSubmitted(SimpleVoting contract) {
        contract.voteSubmittedEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.EARLIEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                log.info("VoteSubmitted evento recibido - voteId: {}, votationId: {}", event.voteId, event.votationId);
                // actualizar usuario en DB a inactive
                try {
                    voteProcessingService.processVoteSubmitted(event);
                } catch (Exception e) {
                    log.error("Error procesando VoteSubmitted: {}", e.getMessage(), e);
                }
            }, error -> {
                log.error("Error en listener VoteSubmitted: {}", error.getMessage(), error);
            });
    }

    private void listenVotationCreated(SimpleVoting contract) {
        contract.votationCreatedEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.EARLIEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                log.info("VotationCreated evento recibido - id: {}, title: {}", event.votationId, event.title);

                // actualizar DB (estado active)
                try {
                    votationService.updateStatus(
                        event.votationId.longValue(),
                        "ACTIVE"
                    );
                    log.info("Estado de votacion {} actualizado a ACTIVE", event.votationId);
                } catch (Exception e) {
                    log.error("Error al actualizar estado de votacion: {}", e.getMessage(), e);
                }
            }, error -> {
                log.error("Error en listener VotationCreated: {}", error.getMessage(), error);
            });
    }

    private void listenVotationUpdated(SimpleVoting contract) {
        contract.votationUpdatedEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.EARLIEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                log.info("VotationUpdated evento recibido - id: {}", event.votationId);

                // actualizar DB (estado active)
                try {
                    votationService.updateStatus(
                        event.votationId.longValue(),
                        "ACTIVE"
                    );
                    log.info("Estado de votacion {} actualizado a ACTIVE", event.votationId);
                } catch (Exception e) {
                    log.error("Error al actualizar estado de votacion: {}", e.getMessage(), e);
                }
            }, error -> {
                log.error("Error en listener VotationUpdated: {}", error.getMessage(), error);
            });
    }

    private void listenVotationCancelled(SimpleVoting contract) {
        contract.votationCancelledEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.EARLIEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                log.info("VotationCancelled evento recibido - id: {}", event.votationId);

                // actualizar DB (estado cancelled)
                try {
                    votationService.updateStatus(
                        event.votationId.longValue(),
                        "CANCELLED"
                    );
                    log.info("Estado de votacion {} actualizado a CANCELLED", event.votationId);
                } catch (Exception e) {
                    log.error("Error al actualizar estado de votacion: {}", e.getMessage(), e);
                }
            }, error -> {
                log.error("Error en listener VotationCancelled: {}", error.getMessage(), error);
            });
    }

    private void listenVotationFinished(SimpleVoting contract) {
        contract.votationFinishedEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.EARLIEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                log.info("VotationFinished evento recibido - id: {}", event.votationId);

                // actualizar DB (estado finished)
                try {
                    votationService.updateStatus(
                        event.votationId.longValue(),
                        "FINISHED"
                    );
                    log.info("Estado de votacion {} actualizado a FINISHED", event.votationId);
                } catch (Exception e) {
                    log.error("Error al actualizar estado de votacion: {}", e.getMessage(), e);
                }
            }, error -> {
                log.error("Error en listener VotationFinished: {}", error.getMessage(), error);
            });
    }
}