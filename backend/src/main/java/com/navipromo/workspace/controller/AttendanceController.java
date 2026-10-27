package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Attendance;
import com.navipromo.workspace.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendances")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService service;

    @GetMapping
    public List<Attendance> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Attendance getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Attendance create(@RequestBody Attendance entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Attendance update(@PathVariable UUID id, @RequestBody Attendance entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
