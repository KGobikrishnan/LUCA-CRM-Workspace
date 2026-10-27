package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Receipt;
import com.navipromo.workspace.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptController {
    private final ReceiptService service;

    @GetMapping
    public List<Receipt> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Receipt getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Receipt create(@RequestBody Receipt entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Receipt update(@PathVariable UUID id, @RequestBody Receipt entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
