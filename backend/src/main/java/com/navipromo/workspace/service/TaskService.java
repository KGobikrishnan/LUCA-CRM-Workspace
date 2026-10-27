package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Task;
import com.navipromo.workspace.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository repository;

    public List<Task> findAll() {
        return repository.findAll();
    }

    public Task findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
    }

    public Task save(Task entity) {
        if (entity.getTaskId() == null || entity.getTaskId().isBlank()) {
            entity.setTaskId(generateNextId());
        }
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    private String generateNextId() {
        String maxId = repository.findMaxTaskId();
        if (maxId == null || maxId.isBlank()) {
            return "TSK-0001";
        }
        try {
            String numPart = maxId.substring(maxId.lastIndexOf('-') + 1);
            int next = Integer.parseInt(numPart) + 1;
            return String.format("TSK-%04d", next);
        } catch (Exception e) {
            return "TSK-0001";
        }
    }
}
