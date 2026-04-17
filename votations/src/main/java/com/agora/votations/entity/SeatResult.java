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

import java.time.LocalDateTime;

@Entity
@Table(name = "seat")
@Getter
@Setter
@NoArgsConstructor
public class SeatResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "votationId", nullable = false)
    private Integer votationId;

    @Column(name = "provinceId", nullable = false)
    private Integer provinceId;

    @Column(name = "partyId", nullable = false)
    private Integer partyId;

    @Column(name = "seatsAssigned", nullable = false)
    private Integer seatsAssigned;

    @Column(name = "votes", nullable = false)
    private Integer votes;

    @Column(name = "calculationDate", nullable = false)
    private LocalDateTime calculationDate;
}