package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.GeneralLedger;
import com.navipromo.workspace.repository.GeneralLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GeneralLedgerService {
    private final GeneralLedgerRepository repository;

    public List<GeneralLedger> findAll() {
        return repository.findAll();
    }

    public GeneralLedger findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("GeneralLedger not found"));
    }

    public GeneralLedger save(GeneralLedger entity) {
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
