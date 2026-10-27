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
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String expenseId;
    
    private String expenseNature;
    private String category;
    private String specificItem;
    private String expenseTitle;
    
    private UUID clientId;
    private UUID userId;
    private String payPeriod;
    private String vendor;
    private String paymentSource;
    private String paymentMode;
    
    private BigDecimal amount;
    private BigDecimal totalAmount;
    private BigDecimal payableAmount;
    
    private String transactionId;
    private String description;
    private LocalDate incurredOn;
    
    private UUID projectId;
    private UUID addedBy;
    private String receiptUrl;
    
    private LocalDateTime createdAt;
}
