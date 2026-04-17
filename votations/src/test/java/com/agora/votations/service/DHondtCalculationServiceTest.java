package com.agora.votations.service;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DHondtCalculationServiceTest {

    @Test
    void allocateDhondt_threePartiesSevenSeats_classicExample() {
        Map<Integer, Integer> votes = new HashMap<>();
        votes.put(1, 340000);
        votes.put(2, 280000);
        votes.put(3, 160000);

        Map<Integer, Integer> seats = DHondtCalculationService.allocateDhondt(votes, 7);

        assertEquals(3, seats.get(1));
        assertEquals(3, seats.get(2));
        assertEquals(1, seats.get(3));
    }

    @Test
    void allocateDhondt_zeroSeats_returnsEmpty() {
        assertEquals(0, DHondtCalculationService.allocateDhondt(Map.of(1, 100), 0).size());
    }
}
