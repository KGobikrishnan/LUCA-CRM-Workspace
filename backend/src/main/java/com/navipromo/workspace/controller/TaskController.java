package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Task;
import com.navipromo.workspace.service.NotificationService;
import com.navipromo.workspace.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService service;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Task>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<Task> create(@RequestBody Task entity) {
        Task saved = service.save(entity);
        // Notify assigned member
        if (saved.getAssignedTo() != null) {
            notificationService.createForUser(
                saved.getAssignedTo(), null,
                "Task Assigned",
                "You have been assigned a new task: \"" + saved.getTitle() + "\" [" + saved.getTaskId() + "]",
                "task_assign"
            );
        }
        // Notify reviewer/QA
        if (saved.getReviewerId() != null && !saved.getReviewerId().equals(saved.getAssignedTo())) {
            notificationService.createForUser(
                saved.getReviewerId(), null,
                "Task Review Assigned",
                "You are the Reviewer/QA for task: \"" + saved.getTitle() + "\" [" + saved.getTaskId() + "]",
                "task_assign"
            );
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> update(@PathVariable UUID id, @RequestBody Task entity) {
        Task existing = service.findById(id);
        entity.setId(id);
        Task updated = service.save(entity);

        // Notify if assignee changed
        if (updated.getAssignedTo() != null &&
            !updated.getAssignedTo().equals(existing.getAssignedTo())) {
            notificationService.createForUser(
                updated.getAssignedTo(), null,
                "Task Reassigned",
                "You have been reassigned to task: \"" + updated.getTitle() + "\" [" + updated.getTaskId() + "]",
                "task_assign"
            );
        }
        // Notify if reviewer changed
        if (updated.getReviewerId() != null &&
            !updated.getReviewerId().equals(existing.getReviewerId()) &&
            !updated.getReviewerId().equals(updated.getAssignedTo())) {
            notificationService.createForUser(
                updated.getReviewerId(), null,
                "QA Review Assigned",
                "You are now the Reviewer/QA for: \"" + updated.getTitle() + "\" [" + updated.getTaskId() + "]",
                "task_assign"
            );
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
