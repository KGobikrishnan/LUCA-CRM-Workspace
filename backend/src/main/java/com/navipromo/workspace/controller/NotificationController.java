package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Notification;
import com.navipromo.workspace.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;

    // Get ALL notifications (admin use)
    @GetMapping
    public List<Notification> getAll() {
        return service.findAll();
    }

    // Get notifications for a specific user (their own + broadcasts)
    @GetMapping("/user/{userId}")
    public List<Notification> getForUser(@PathVariable UUID userId) {
        return service.findForUser(userId);
    }

    // Get unread count for a user
    @GetMapping("/user/{userId}/unread-count")
    public Map<String, Long> getUnreadCount(@PathVariable UUID userId) {
        return Map.of("count", service.countUnread(userId));
    }

    // Mark a single notification as read
    @PutMapping("/{id}/read")
    public Notification markRead(@PathVariable UUID id) {
        return service.markRead(id);
    }

    // Mark ALL notifications as read for a user
    @PutMapping("/user/{userId}/mark-all-read")
    public ResponseEntity<Void> markAllRead(@PathVariable UUID userId) {
        service.markAllReadForUser(userId);
        return ResponseEntity.ok().build();
    }

    // Admin: Send a message notification (to specific user or broadcast)
    @PostMapping("/send")
    public ResponseEntity<Notification> send(@RequestBody Map<String, String> req) {
        String title = req.getOrDefault("title", "Message");
        String message = req.get("message");
        String senderIdStr = req.get("senderId");
        String targetUserIdStr = req.get("targetUserId"); // null/empty = broadcast

        UUID senderId = senderIdStr != null ? UUID.fromString(senderIdStr) : null;

        Notification n;
        if (targetUserIdStr == null || targetUserIdStr.isBlank() || targetUserIdStr.equals("ALL")) {
            n = service.broadcast(senderId, title, message);
        } else {
            n = service.createForUser(UUID.fromString(targetUserIdStr), senderId, title, message, "message");
        }
        return ResponseEntity.ok(n);
    }

    // Internal: Create a notification for a user (e.g. task/project assign)
    @PostMapping
    public Notification create(@RequestBody Notification entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
