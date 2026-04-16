package com.agora.votations.service;

import com.agora.votations.contract.SimpleVoting;
import com.agora.votations.entity.BlockEntity;
import com.agora.votations.entity.VoteEntity;
import com.agora.votations.entity.VoteIntentEntity;
import com.agora.votations.repository.AppUserRepository;
import com.agora.votations.repository.BlockRepository;
import com.agora.votations.repository.VoteEntityRepository;
import com.agora.votations.repository.VoteIntentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthBlock;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoteProcessingService {

    private final VoteIntentRepository voteIntentRepository;
    private final AppUserRepository appUserRepository;
    private final VoteEntityRepository voteEntityRepository;
    private final BlockRepository blockRepository;
    private final VoteWebSocketService voteWebSocketService;
    private final Web3j web3j;

    @Transactional
    public void processVoteSubmitted(SimpleVoting.VoteSubmittedEventResponse event) {
        if (event.log == null) {
            log.warn("VoteSubmitted sin log asociado");
            return;
        }
        String voteHashHex = normalizeVoteHash(event.voteHash);
        String txHash = event.log.getTransactionHash();
        String blockHash = event.log.getBlockHash();
        BigInteger blockNumber = event.log.getBlockNumber();

        ensureBlockExists(blockHash, blockNumber);

        Optional<VoteIntentEntity> intentOpt = voteIntentRepository.findByVoteHash(voteHashHex);
        if (intentOpt.isEmpty()) {
            log.warn("No hay vote_intent para voteHash {} (huérfano o replay)", voteHashHex);
            return;
        }
        VoteIntentEntity intent = intentOpt.get();

        appUserRepository.findById(intent.getUserId()).ifPresent(u -> {
            u.setActive(false);
            appUserRepository.save(u);
            log.info("Usuario {} marcado como inactivo tras voto", intent.getUserId());
        });

        VoteEntity vote = new VoteEntity();
        vote.setVoteHash(voteHashHex);
        vote.setVotationId(event.votationId.intValue());
        vote.setPartyId(event.partyId.intValue());
        vote.setMunicipalityId(event.municipalityId.intValue());
        vote.setBlockHash(blockHash);
        vote.setTxHash(txHash);
        try {
            VoteEntity savedVote = voteEntityRepository.save(vote);
            log.info("Voto guardado en BD: voteHash={}", voteHashHex);
            
            // Broadcast en tiempo real a todos los clientes conectados (admin)
            voteWebSocketService.broadcastVote(savedVote);
            
        } catch (DataIntegrityViolationException e) {
            log.error("No se pudo guardar el voto (duplicado u otra violación): {}", e.getMessage());
        }

        voteIntentRepository.delete(intent);
    }

    private void ensureBlockExists(String blockHash, BigInteger blockNumberBig) {
        if (blockHash == null || blockRepository.existsById(blockHash)) {
            return;
        }
        int blockNum = blockNumberBig != null ? blockNumberBig.intValue() : 0;
        String parentHash = null;
        try {
            EthBlock.Block block = web3j.ethGetBlockByHash(blockHash, false).send().getBlock();
            if (block != null) {
                parentHash = block.getParentHash();
            }
        } catch (Exception e) {
            log.debug("No se pudo leer bloque: {}", e.getMessage());
        }
        BlockEntity b = new BlockEntity();
        b.setHash(blockHash);
        b.setBlockNumber(blockNum);
        b.setPreviousHash(parentHash);
        b.setTransactions(1);
        b.setValid(true);
        blockRepository.save(b);
    }

    private String normalizeVoteHash(byte[] raw) {
        if (raw == null || raw.length == 0) {
            return "";
        }
        String hex = Numeric.toHexStringNoPrefix(raw);
        if (hex.length() < 64) {
            hex = "0".repeat(64 - hex.length()) + hex;
        }
        return ("0x" + hex).toLowerCase();
    }
}
