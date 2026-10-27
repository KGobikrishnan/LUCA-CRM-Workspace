package com.navipromo.workspace.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String taskId;
    private String title;
    private UUID projectId;
    private String taskType;
    private String description;
    private String deliveryType;
    private String status;
    private String priority;
    private UUID assignedTo;
    private UUID reviewerId;
    private LocalDate startDate;
    private LocalDate dueDate;
    private BigDecimal estHours;
    private BigDecimal actHours;
    private String qaStatus;
    private Integer reworkCount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
