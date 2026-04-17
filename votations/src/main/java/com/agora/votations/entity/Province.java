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
@Table(name = "province")
@Getter
@Setter
@NoArgsConstructor
public class Province {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ineId", nullable = false)
    private Integer ineId;

    @Column(name = "autonomousCommunityId", nullable = false)
    private Integer autonomousCommunityId;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "totalSeats", nullable = false)
    private Integer totalSeats;
}