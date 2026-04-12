package com.agora.votations.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.agora.votations.entity.Votation;

public interface VotationRepository extends JpaRepository<Votation, Integer> {
    // El método findById ya viene de JpaRepository (retorna Optional<Votation>)
}