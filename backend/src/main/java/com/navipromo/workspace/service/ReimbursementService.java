package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Reimbursement;
import com.navipromo.workspace.repository.ReimbursementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReimbursementService {
    private final ReimbursementRepository repository;

    public List<Reimbursement> findAll() {
        return repository.findAll();
    }

    public Reimbursement findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Reimbursement not found"));
    }

    public Reimbursement save(Reimbursement entity) {
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
