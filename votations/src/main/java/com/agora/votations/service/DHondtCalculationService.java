package com.agora.votations.service;

import com.agora.votations.entity.Municipality;
import com.agora.votations.entity.Province;
import com.agora.votations.entity.SeatResult;
import com.agora.votations.entity.VoteEntity;
import com.agora.votations.repository.MunicipalityRepository;
import com.agora.votations.repository.ProvinceRepository;
import com.agora.votations.repository.SeatResultRepository;
import com.agora.votations.repository.VoteEntityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

// Calcula escaños por provincia (circunscripción) con la Ley D'Hondt y persiste en {@code seat}.
@Slf4j
@Service
@RequiredArgsConstructor
public class DHondtCalculationService {

    private final VoteEntityRepository voteEntityRepository;
    private final MunicipalityRepository municipalityRepository;
    private final ProvinceRepository provinceRepository;
    private final SeatResultRepository seatResultRepository;

    @Transactional
    public void calculateAndStore(Integer votationId) {
        Objects.requireNonNull(votationId, "votationId");

        List<VoteEntity> votes = voteEntityRepository.findByVotationId(votationId);
        if (votes.isEmpty()) {
            log.warn("D'Hondt: sin votos para votationId={}", votationId);
            seatResultRepository.deleteByVotationId(votationId);
            return;
        }

        Set<Integer> municipalityIds = votes.stream()
                .map(VoteEntity::getMunicipalityId)
                .collect(Collectors.toSet());

        List<Municipality> municipalities = municipalityRepository.findByIdIn(municipalityIds);
        Map<Integer, Integer> municipalityToProvince = municipalities.stream()
                .collect(Collectors.toMap(Municipality::getId, Municipality::getProvinceId));

        Map<Integer, Map<Integer, Integer>> votesByProvinceThenParty = new HashMap<>();
        for (VoteEntity v : votes) {
            Integer provinceId = municipalityToProvince.get(v.getMunicipalityId());
            if (provinceId == null) {
                log.warn("D'Hondt: municipio {} sin provincia en BD, voto omitido", v.getMunicipalityId());
                continue;
            }
            votesByProvinceThenParty
                    .computeIfAbsent(provinceId, k -> new HashMap<>())
                    .merge(v.getPartyId(), 1, Integer::sum);
        }

        seatResultRepository.deleteByVotationId(votationId);
        LocalDateTime now = LocalDateTime.now();
        List<SeatResult> toSave = new ArrayList<>();

        for (Map.Entry<Integer, Map<Integer, Integer>> provEntry : votesByProvinceThenParty.entrySet()) {
            Integer provinceId = provEntry.getKey();
            Map<Integer, Integer> partyVotes = provEntry.getValue();

            Province province = provinceRepository.findById(provinceId).orElse(null);
            if (province == null) {
                log.warn("D'Hondt: provincia {} no encontrada", provinceId);
                continue;
            }
            int seatsToAssign = Math.max(0, province.getTotalSeats() == null ? 0 : province.getTotalSeats());
            if (seatsToAssign == 0) {
                log.warn("D'Hondt: provincia {} tiene totalSeats=0, se omite asignación", provinceId);
                continue;
            }

            Map<Integer, Integer> seatAllocation = allocateDhondt(partyVotes, seatsToAssign);
            for (Map.Entry<Integer, Integer> partyEntry : partyVotes.entrySet()) {
                int partyId = partyEntry.getKey();
                int voteCount = partyEntry.getValue();
                int seats = seatAllocation.getOrDefault(partyId, 0);
                if (seats <= 0) {
                    continue;
                }
                SeatResult row = new SeatResult();
                row.setVotationId(votationId);
                row.setProvinceId(provinceId);
                row.setPartyId(partyId);
                row.setVotes(voteCount);
                row.setSeatsAssigned(seats);
                row.setCalculationDate(now);
                toSave.add(row);
            }
        }

        seatResultRepository.saveAll(toSave);
        log.info("D'Hondt: guardados {} registros de escaños para votationId={}", toSave.size(), votationId);
    }

    // Asigno {@code seats} escaños por D'Hondt entre partidos con sus votos totales
    static Map<Integer, Integer> allocateDhondt(Map<Integer, Integer> partyVotes, int seats) {
        Map<Integer, Integer> allocation = new HashMap<>();
        if (seats <= 0 || partyVotes == null || partyVotes.isEmpty()) {
            return allocation;
        }

        Map<Integer, Integer> won = new HashMap<>();
        partyVotes.keySet().forEach(pid -> won.put(pid, 0));

        for (int i = 0; i < seats; i++) {
            Integer bestParty = null;
            double bestScore = -1.0;
            for (Map.Entry<Integer, Integer> e : partyVotes.entrySet()) {
                int partyId = e.getKey();
                int votes = e.getValue();
                if (votes <= 0) {
                    continue;
                }
                int assigned = won.getOrDefault(partyId, 0);
                double score = votes / (double) (assigned + 1);
                boolean better = bestParty == null
                        || score > bestScore + 1e-12
                        || (Math.abs(score - bestScore) < 1e-12 && partyId < bestParty);
                if (better) {
                    bestScore = score;
                    bestParty = partyId;
                }
            }
            if (bestParty == null) {
                break;
            }
            won.merge(bestParty, 1, Integer::sum);
        }
        return won.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.comparingByKey(Comparator.naturalOrder()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, HashMap::new));
    }
}