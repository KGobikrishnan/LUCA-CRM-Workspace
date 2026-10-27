package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.LeaveRequests;
import com.navipromo.workspace.service.LeaveRequestsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveRequestsController {
    private final LeaveRequestsService service;

    @GetMapping
    public List<LeaveRequests> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public LeaveRequests getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public LeaveRequests create(@RequestBody LeaveRequests entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public LeaveRequests update(@PathVariable UUID id, @RequestBody LeaveRequests entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
