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
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String invoiceId;
    private UUID clientId;
    private UUID projectId;
    private UUID quotationId;
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String items;
    
    private BigDecimal grossSubtotal;
    private BigDecimal subtotal;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal taxableValue;
    private Boolean gstEnabled;
    private BigDecimal total;
    
    private BigDecimal amountPaid;
    private String paymentStatus;
    private LocalDate dueDate;
    private String notes;
    
    private String creditTerms;
    private BigDecimal creditMarkupPercentage;
    
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String customTerms;
    
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String profitabilityAnalysis;

    private LocalDateTime createdAt;
}
