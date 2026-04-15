package com.agora.votations.repository;

import com.agora.votations.entity.VoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteEntityRepository extends JpaRepository<VoteEntity, Integer> {
}
