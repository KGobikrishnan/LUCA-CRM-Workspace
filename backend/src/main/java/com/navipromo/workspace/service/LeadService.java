package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Lead;
import com.navipromo.workspace.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeadService {
    private final LeadRepository repository;

    public List<Lead> findAll() {
        return repository.findAll();
    }

    public Lead findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
    }

    public Lead save(Lead entity) {
        if (entity.getLeadId() == null || entity.getLeadId().isBlank()) {
            entity.setLeadId(generateNextId());
        }
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    private String generateNextId() {
        String maxId = repository.findMaxLeadId();
        if (maxId == null || maxId.isBlank()) {
            return "LEAD-0001";
        }
        try {
            String numPart = maxId.substring(maxId.lastIndexOf('-') + 1);
            int next = Integer.parseInt(numPart) + 1;
            return String.format("LEAD-%04d", next);
        } catch (Exception e) {
            return "LEAD-0001";
        }
    }
}
