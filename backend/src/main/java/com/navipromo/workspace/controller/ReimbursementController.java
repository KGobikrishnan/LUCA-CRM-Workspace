package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Reimbursement;
import com.navipromo.workspace.service.ReimbursementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reimbursements")
@RequiredArgsConstructor
public class ReimbursementController {
    private final ReimbursementService service;

    @GetMapping
    public List<Reimbursement> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Reimbursement getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Reimbursement create(@RequestBody Reimbursement entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Reimbursement update(@PathVariable UUID id, @RequestBody Reimbursement entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
