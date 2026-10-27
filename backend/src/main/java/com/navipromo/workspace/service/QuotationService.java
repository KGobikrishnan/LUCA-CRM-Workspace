package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Quotation;
import com.navipromo.workspace.repository.QuotationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuotationService {
    private final QuotationRepository repository;

    public List<Quotation> findAll() {
        return repository.findAll();
    }

    public Quotation findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Quotation not found"));
    }

    public Quotation save(Quotation entity) {
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
