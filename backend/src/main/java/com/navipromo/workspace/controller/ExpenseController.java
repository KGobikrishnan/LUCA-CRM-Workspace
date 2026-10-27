package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Expense;
import com.navipromo.workspace.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {
    private final ExpenseService service;

    @GetMapping
    public List<Expense> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Expense getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Expense create(@RequestBody Expense entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Expense update(@PathVariable UUID id, @RequestBody Expense entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
