package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.ServiceCatalog;
import com.navipromo.workspace.service.ServiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/service-catalog")
@RequiredArgsConstructor
public class ServiceCatalogController {
    private final ServiceCatalogService service;

    @GetMapping
    public List<ServiceCatalog> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ServiceCatalog getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public ServiceCatalog create(@RequestBody ServiceCatalog entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ServiceCatalog update(@PathVariable UUID id, @RequestBody ServiceCatalog entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
