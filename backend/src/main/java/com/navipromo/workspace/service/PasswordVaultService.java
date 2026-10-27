package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.PasswordVault;
import com.navipromo.workspace.repository.PasswordVaultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordVaultService {
    private final PasswordVaultRepository repository;

    public List<PasswordVault> findAll() {
        return repository.findAll();
    }

    public PasswordVault findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("PasswordVault not found"));
    }

    public PasswordVault save(PasswordVault entity) {
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
