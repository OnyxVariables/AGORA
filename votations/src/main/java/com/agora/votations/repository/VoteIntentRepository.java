package com.agora.votations.repository;

import com.agora.votations.entity.VoteIntentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoteIntentRepository extends JpaRepository<VoteIntentEntity, Long> {

    Optional<VoteIntentEntity> findByVoteHash(String voteHash);
}
