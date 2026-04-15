package com.agora.votations.service;

import com.agora.votations.entity.Votation;
import com.agora.votations.repository.VotationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VotationServiceTest {

    @Mock
    private VotationRepository repository;

    @InjectMocks
    private VotationService votationService;

    @Test
    void updateState_persistsWhenFound() {
        Votation v = new Votation();
        v.setId(5);
        v.setState(Votation.State.pending);
        when(repository.findById(5)).thenReturn(Optional.of(v));
        when(repository.save(any(Votation.class))).thenAnswer(i -> i.getArgument(0));

        votationService.updateState(5, Votation.State.active);

        ArgumentCaptor<Votation> cap = ArgumentCaptor.forClass(Votation.class);
        verify(repository).save(cap.capture());
        assertThat(cap.getValue().getState()).isEqualTo(Votation.State.active);
    }

    @Test
    void updateState_whenMissing_doesNotSave() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        votationService.updateState(99, Votation.State.finished);

        verify(repository, never()).save(any());
    }

    @Test
    void updateStatus_active_delegates() {
        Votation v = new Votation();
        v.setId(1);
        v.setState(Votation.State.pending);
        when(repository.findById(1)).thenReturn(Optional.of(v));
        when(repository.save(any(Votation.class))).thenAnswer(i -> i.getArgument(0));

        votationService.updateStatus(1L, "ACTIVE");

        verify(repository).save(any());
    }

    @Test
    void updateStatus_invalid_throws() {
        assertThatThrownBy(() -> votationService.updateStatus(1L, "NOT_A_STATE"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
