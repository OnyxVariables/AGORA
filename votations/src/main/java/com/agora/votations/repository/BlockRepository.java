package com.agora.votations.repository;

import com.agora.votations.entity.BlockEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlockRepository extends JpaRepository<BlockEntity, String> {
}
