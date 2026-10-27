package com.navipromo.workspace.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // null = broadcast to all users, otherwise specific user
    private UUID userId;

    // Who sent it (admin sender)
    private UUID senderId;

    private String title;
    private String message;
    private String type; // task_assign | project_assign | message | system

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
