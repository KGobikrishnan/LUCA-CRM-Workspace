package com.navipromo.workspace.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String clientId;
    private String businessName;
    private String primaryContact;
    private String email;
    private String phone;
    private String whatsapp;
    private String type;
    private String status;
    private String designation;
    private String website;
    private Boolean gstRegistered;
    private String gstNumber;
    private String paymentTerms;
    private String address;
    private String billingAddress;
    private String city;
    private UUID leadId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
