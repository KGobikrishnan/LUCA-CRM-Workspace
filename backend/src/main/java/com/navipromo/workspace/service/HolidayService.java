package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Holiday;
import com.navipromo.workspace.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HolidayService {
    private final HolidayRepository repository;

    public List<Holiday> findAll() {
        return repository.findAllByOrderByDateAsc();
    }

    public List<Holiday> findBetween(LocalDate start, LocalDate end) {
        return repository.findByDateBetween(start, end);
    }

    public Holiday save(Holiday holiday) {
        return repository.save(holiday);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    public boolean isHoliday(LocalDate date) {
        return repository.findByDate(date).isPresent();
    }
}
