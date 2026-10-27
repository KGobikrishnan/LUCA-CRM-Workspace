package com.navipromo.workspace.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "leads")
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String leadId;
    private String leadName;
    private String companyOrg;
    private String email;
    private String phone;
    private String whatsapp;
    private String city;
    private String address;
    private String type;
    private String source;
    private String status;
    private String pipelineStage;
    private String priority;
    private String requirementSummary;
    private BigDecimal expectedValue;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
