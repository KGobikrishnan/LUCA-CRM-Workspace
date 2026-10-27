package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Payroll;
import com.navipromo.workspace.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {
    private final PayrollService service;

    @GetMapping
    public List<Payroll> getAll(@RequestParam(required = false) String period) {
        if (period != null && !period.isEmpty()) {
            return service.findByPayPeriod(period);
        }
        return service.findAll();
    }
    
    @PostMapping("/generate")
    public List<Payroll> generate(@RequestParam String period) {
        return service.generatePayrollForPeriod(period);
    }

    @GetMapping("/{id}")
    public Payroll getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Payroll create(@RequestBody Payroll entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Payroll update(@PathVariable UUID id, @RequestBody Payroll entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
