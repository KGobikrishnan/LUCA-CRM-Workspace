package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Lead;
import com.navipromo.workspace.service.LeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {
    private final LeadService service;

    @GetMapping
    public List<Lead> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Lead getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Lead create(@RequestBody Lead entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Lead update(@PathVariable UUID id, @RequestBody Lead entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
