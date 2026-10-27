package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Project;
import com.navipromo.workspace.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository repository;

    public List<Project> findAll() {
        return repository.findAll();
    }

    public Project findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
    }

    public Project save(Project entity) {
        if (entity.getProjectId() == null || entity.getProjectId().isBlank()) {
            entity.setProjectId(generateNextId());
        }
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    private String generateNextId() {
        String maxId = repository.findMaxProjectId();
        if (maxId == null || maxId.isBlank()) {
            return "PRJ-0001";
        }
        try {
            String numPart = maxId.substring(maxId.lastIndexOf('-') + 1);
            int next = Integer.parseInt(numPart) + 1;
            return String.format("PRJ-%04d", next);
        } catch (Exception e) {
            return "PRJ-0001";
        }
    }
}
