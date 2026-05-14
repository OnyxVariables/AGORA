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
@Table(name = "vote_intent")
@Getter
@Setter
@NoArgsConstructor
public class VoteIntentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "userId", nullable = false)
    private Integer userId;

    @Column(name = "voteHash", nullable = false, unique = true, length = 130)
    private String voteHash;

    @Column(name = "votationId", nullable = false)
    private Integer votationId;
}
