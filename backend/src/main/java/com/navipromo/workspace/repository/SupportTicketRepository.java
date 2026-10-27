package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT t.ticketId FROM SupportTicket t ORDER BY t.ticketId DESC LIMIT 1")
    String findMaxTicketId();
}
