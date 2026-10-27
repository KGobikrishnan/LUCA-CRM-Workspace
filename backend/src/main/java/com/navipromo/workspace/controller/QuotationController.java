package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Quotation;
import com.navipromo.workspace.service.QuotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class QuotationController {
    private final QuotationService service;

    @GetMapping
    public List<Quotation> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Quotation getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Quotation create(@RequestBody Quotation entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Quotation update(@PathVariable UUID id, @RequestBody Quotation entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
