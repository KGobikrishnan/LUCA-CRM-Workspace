package com.navipromo.workspace.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String projectId;
    private String projectName;
    private UUID clientId;
    private String type;
    private String description;
    private LocalDate startDate;
    private LocalDate targetEnd;
    private LocalDate actualEnd;
    private String status;
    private String priority;
    private String health;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "project_team",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private java.util.Set<User> teamMembers = new java.util.HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
