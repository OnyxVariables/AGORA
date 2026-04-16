package com.agora.votations.repository;

import com.agora.votations.entity.VoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VoteEntityRepository extends JpaRepository<VoteEntity, Integer> {
    List<VoteEntity> findByVotationId(Integer votationId);
}
