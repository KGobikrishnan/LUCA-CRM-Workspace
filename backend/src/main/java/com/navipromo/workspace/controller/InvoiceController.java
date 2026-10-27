package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Invoice;
import com.navipromo.workspace.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {
    private final InvoiceService service;

    @GetMapping
    public List<Invoice> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Invoice getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Invoice create(@RequestBody Invoice entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Invoice update(@PathVariable UUID id, @RequestBody Invoice entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
