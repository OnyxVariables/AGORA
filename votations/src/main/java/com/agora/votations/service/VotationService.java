package com.agora.votations.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agora.votations.entity.Votation;
import com.agora.votations.entity.Votation.State;
import com.agora.votations.repository.VotationRepository;

@Service
public class VotationService {

    private final VotationRepository repository;

    public VotationService(VotationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void updateState(Integer id, State newState) {
        repository.findById(id).ifPresentOrElse(
            v -> {
                v.setState(newState);
                repository.save(v);
            },
            () -> System.out.println("Votation no encontrada: " + id)
        );
    }

    // Método alternativo para el listener (acepta long y String)
    @Transactional
    public void updateStatus(Long id, String status) {
        State state = State.valueOf(status.toLowerCase());
        updateState(id.intValue(), state);
    }
}