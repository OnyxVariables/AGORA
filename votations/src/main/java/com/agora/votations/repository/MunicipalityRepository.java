package com.agora.votations.repository;

import com.agora.votations.entity.Municipality;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MunicipalityRepository extends JpaRepository<Municipality, Integer> {
    List<Municipality> findByIdIn(Collection<Integer> ids);
}