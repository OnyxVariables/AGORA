package com.agora.votations.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.web3j.protocol.Web3j;

import com.agora.votations.contract.SimpleVoting;

import java.math.BigInteger;

@Service
public class BlockchainListenerService {

    private final Web3j web3j;

    private static final String CONTRACT_ADDRESS = "0xasdfh... no lo tengo por ahora";

    public BlockchainListenerService(Web3j web3j) {
        this.web3j = web3j;
    }

    @PostConstruct
    public void startListening() {
        try {
            SimpleVoting contract = SimpleVoting.load(
                    CONTRACT_ADDRESS,
                    web3j,
                    org.web3j.tx.ClientTransactionManager(web3j, "0x0"),
                    BigInteger.valueOf(0),
                    BigInteger.valueOf(0)
            );

            listenVoteSubmitted(contract);
            listenVotationCreated(contract);
            listenVotationUpdated(contract);
            listenVotationCancelled(contract);
            listenVotationFinished(contract);

            System.out.println("Escuchando eventos blockchain");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // EVENTOS
    private void listenVoteSubmitted(SimpleVoting contract) {
        contract.voteSubmittedEventFlowable(org.web3j.protocol.core.DefaultBlockParameterName.LATEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                System.out.println("VoteSubmitted:");
                System.out.println("voteId: " + event.voteId);
                System.out.println("votationId: " + event.votationId);
                System.out.println("partyId: " + event.partyId);
                System.out.println("timestamp: " + event.timestamp);

                // actualizar usuario en DB a inactive
            });
    }

    private void listenVotationCreated(SimpleVoting contract) {
        contract.votationCreatedEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                System.out.println("VotationCreated:");
                System.out.println("id: " + event.votationId);
                System.out.println("title: " + event.title);

                // actualizar DB (estado active)
            });
    }

    private void listenVotationUpdated(SimpleVoting contract) {
        contract.votationUpdatedEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                System.out.println("VotationUpdated: " + event.votationId);

                // actualizar DB (estado active)
            });
    }

    private void listenVotationCancelled(SimpleVoting contract) {
        contract.votationCancelledEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                System.out.println("VotationCancelled: " + event.votationId);

                // actualizar DB (estado cancelled)
            });
    }

    private void listenVotationFinished(SimpleVoting contract) {
        contract.votationFinishedEventFlowable(
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST,
                org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
            .subscribe(event -> {
                System.out.println("VotationFinished: " + event.votationId);

                // actualizar DB (estado finished)
            });
    }
}