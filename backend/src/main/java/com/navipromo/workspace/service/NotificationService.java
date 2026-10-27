package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Notification;
import com.navipromo.workspace.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;

    public List<Notification> findAll() {
        return repository.findAll();
    }

    public List<Notification> findForUser(UUID userId) {
        return repository.findByUserIdOrBroadcast(userId);
    }

    public long countUnread(UUID userId) {
        return repository.countUnreadForUser(userId);
    }

    public Notification findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    public Notification save(Notification entity) {
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }
        if (entity.getIsRead() == null) {
            entity.setIsRead(false);
        }
        return repository.save(entity);
    }

    public Notification markRead(UUID id) {
        Notification n = findById(id);
        n.setIsRead(true);
        return repository.save(n);
    }

    public void markAllReadForUser(UUID userId) {
        List<Notification> list = repository.findByUserIdOrBroadcast(userId);
        list.forEach(n -> n.setIsRead(true));
        repository.saveAll(list);
    }

    // Convenience: create a notification for a specific user
    public Notification createForUser(UUID targetUserId, UUID senderId, String title, String message, String type) {
        Notification n = new Notification();
        n.setUserId(targetUserId);
        n.setSenderId(senderId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        return repository.save(n);
    }

    // Convenience: broadcast to all (userId = null)
    public Notification broadcast(UUID senderId, String title, String message) {
        Notification n = new Notification();
        n.setUserId(null); // null = all users see it
        n.setSenderId(senderId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType("message");
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());
        return repository.save(n);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
