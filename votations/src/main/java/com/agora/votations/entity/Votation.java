package com.agora.votations.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "votation")
@Getter
@Setter
@NoArgsConstructor
public class Votation {

    @Id
    @Column(name = "id")
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false)
    private State state;

    public enum State {
        pending, active, finished, cancelled
    }
}