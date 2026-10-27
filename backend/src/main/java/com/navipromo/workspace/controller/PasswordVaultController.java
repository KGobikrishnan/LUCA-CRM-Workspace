package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.PasswordVault;
import com.navipromo.workspace.service.PasswordVaultService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/password-vaults")
@RequiredArgsConstructor
public class PasswordVaultController {
    private final PasswordVaultService service;

    @GetMapping
    public List<PasswordVault> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PasswordVault getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public PasswordVault create(@RequestBody PasswordVault entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public PasswordVault update(@PathVariable UUID id, @RequestBody PasswordVault entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
