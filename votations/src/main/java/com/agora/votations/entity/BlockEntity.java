package com.agora.votations.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "block")
@Getter
@Setter
@NoArgsConstructor
public class BlockEntity {

    @Id
    @Column(name = "hash", length = 130)
    private String hash;

    @Column(name = "blockNumber", nullable = false)
    private Integer blockNumber;

    @Column(name = "previousHash", length = 130)
    private String previousHash;

    @Column(name = "transactions", nullable = false)
    private Integer transactions;

    @Column(name = "isValid", nullable = false)
    private Boolean valid;
}
