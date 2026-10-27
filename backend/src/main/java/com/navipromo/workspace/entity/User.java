package com.navipromo.workspace.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "employee_id", unique = true, nullable = false)
    private String employeeId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password_hash")
    private String passwordHash;

    @Transient
    private Boolean hasAccess;

    @Column(nullable = false)
    private String role;

    private String jobType;
    private String department;
    private Double monthlySalary;
    private String designation;
    private String phone;
    private String adhaarNumber;
    private String residentialAddress;
    private String city;
    private String parentGuardianName;
    private String emergencyPhone;
    private String bloodGroup;
    
    // Bank Details
    private String bankName;
    private String branchName;
    private String accountHolderName;
    private String accountNumber;
    private String ifscCode;
    private String upiId;

    @Column(columnDefinition = "TEXT")
    private String profilePhoto; // Base64 representation

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
