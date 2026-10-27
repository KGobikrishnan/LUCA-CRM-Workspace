package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Attendance;
import com.navipromo.workspace.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {
    private final AttendanceRepository repository;

    public List<Attendance> findAll() {
        return repository.findAll();
    }

    public Attendance findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Attendance not found"));
    }

    public Attendance save(Attendance entity) {
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
