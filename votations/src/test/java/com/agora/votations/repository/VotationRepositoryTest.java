package com.agora.votations.repository;

import com.agora.votations.entity.Votation;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class VotationRepositoryTest {

    @Autowired
    private VotationRepository votationRepository;

    @Test
    void saveAndFindById() {
        Votation v = new Votation();
        v.setId(42);
        v.setState(Votation.State.pending);
        votationRepository.save(v);

        Optional<Votation> found = votationRepository.findById(42);
        assertThat(found).isPresent();
        assertThat(found.get().getState()).isEqualTo(Votation.State.pending);
    }
}
