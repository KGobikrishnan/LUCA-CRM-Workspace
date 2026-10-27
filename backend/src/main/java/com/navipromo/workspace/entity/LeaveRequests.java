package com.navipromo.workspace.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "leave_requests")
public class LeaveRequests {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true)
    private String requestId;
    
    private UUID userId;
    private String leaveType;
    private LocalDate fromDate;
    private LocalDate toDate;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    private String status;
    private UUID approvedBy;
    
    @CreationTimestamp
    @Column(name = "applied_on", updatable = false)
    private LocalDateTime appliedOn;
}
