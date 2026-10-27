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
@Table(name = "payroll")
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    private String payrollId;
    private UUID userId;
    private String payPeriod;
    
    private BigDecimal basicSalary;
    private BigDecimal additions;
    private BigDecimal manualBonus;
    private BigDecimal deductions;
    private BigDecimal netPay;
    
    private String status;
    private String notes;
    private LocalDate processedOn;
}
