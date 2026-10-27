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
@Table(name = "support_tickets")
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String ticketId;
    private String subject;
    private UUID clientId;
    private UUID projectId;
    private String issueDescription;
    private String status;
    private String priority;
    private UUID assigneeId;
    private LocalDateTime createdOn;
}
