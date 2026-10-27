package com.navipromo.workspace.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "quotations")
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String quotationId;
    private UUID clientId;
    private UUID leadId; // Null if it's for a client
    private Boolean isForLead;
    private UUID projectId;
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String items;
    private BigDecimal grossSubtotal;
    private BigDecimal subtotal; // Keeps original functionality
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal taxableValue;
    private Boolean gstEnabled;
    private BigDecimal total;
    private String status;
    private LocalDate validUntil;
    private LocalDate followUp;
    private String creditTerms;
    private BigDecimal creditMarkupPercentage;
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String customTerms;
    private String notes;
    
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String profitabilityAnalysis;
    
    private LocalDateTime createdAt;
}
