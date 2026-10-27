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
@Table(name = "receipts")
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String receiptId;
    
    private Boolean isLinkedToInvoice;
    private UUID invoiceId;
    private UUID clientId;
    private BigDecimal amount;
    
    private BigDecimal invoiceTotal;
    private BigDecimal invoiceBalance;
    
    private String paymentMode;
    private String paymentPurpose;
    private String referenceNumber;
    
    private LocalDate receivedOn;
    private String receivedBy;
    private String notes;
    
    private LocalDateTime createdAt;
}
