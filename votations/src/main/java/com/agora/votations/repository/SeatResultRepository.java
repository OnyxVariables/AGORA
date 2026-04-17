package com.agora.votations.repository;

import com.agora.votations.entity.SeatResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SeatResultRepository extends JpaRepository<SeatResult, Integer> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from SeatResult s where s.votationId = :votationId")
    void deleteByVotationId(@Param("votationId") Integer votationId);
}