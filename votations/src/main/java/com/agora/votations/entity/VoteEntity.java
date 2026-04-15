package com.agora.votations.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vote")
@Getter
@Setter
@NoArgsConstructor
public class VoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "voteHash", nullable = false, unique = true, length = 130)
    private String voteHash;

    @Column(name = "votationId", nullable = false)
    private Integer votationId;

    @Column(name = "partyId", nullable = false)
    private Integer partyId;

    @Column(name = "municipalityId", nullable = false)
    private Integer municipalityId;

    @Column(name = "blockHash", nullable = false, length = 130)
    private String blockHash;

    @Column(name = "txHash", nullable = false, length = 130)
    private String txHash;
}
