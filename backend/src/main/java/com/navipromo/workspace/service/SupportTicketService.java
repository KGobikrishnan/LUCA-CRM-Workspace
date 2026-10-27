package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.SupportTicket;
import com.navipromo.workspace.repository.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportTicketService {
    private final SupportTicketRepository repository;

    public List<SupportTicket> findAll() {
        return repository.findAll();
    }

    public SupportTicket findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("SupportTicket not found"));
    }

    public SupportTicket save(SupportTicket entity) {
        if (entity.getTicketId() == null || entity.getTicketId().isBlank()) {
            entity.setTicketId(generateNextId());
        }
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    private String generateNextId() {
        String maxId = repository.findMaxTicketId();
        if (maxId == null || maxId.isBlank()) {
            return "TKT-0001";
        }
        try {
            String numPart = maxId.substring(maxId.lastIndexOf('-') + 1);
            int next = Integer.parseInt(numPart) + 1;
            return String.format("TKT-%04d", next);
        } catch (Exception e) {
            return "TKT-0001";
        }
    }
}
