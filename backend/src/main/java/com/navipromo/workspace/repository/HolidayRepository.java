package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HolidayRepository extends JpaRepository<Holiday, UUID> {
    List<Holiday> findByDateBetween(LocalDate start, LocalDate end);
    Optional<Holiday> findByDate(LocalDate date);
    List<Holiday> findAllByOrderByDateAsc();
}
