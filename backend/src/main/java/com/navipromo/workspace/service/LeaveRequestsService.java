package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.LeaveRequests;
import com.navipromo.workspace.repository.LeaveRequestsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaveRequestsService {
    private final LeaveRequestsRepository repository;

    public List<LeaveRequests> findAll() {
        return repository.findAll();
    }

    public LeaveRequests findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("LeaveRequests not found"));
    }

    public LeaveRequests save(LeaveRequests entity) {
        if (entity.getRequestId() == null || entity.getRequestId().isEmpty()) {
            long count = repository.count() + 1;
            entity.setRequestId(String.format("NP-LR-%03d", count));
        }
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
