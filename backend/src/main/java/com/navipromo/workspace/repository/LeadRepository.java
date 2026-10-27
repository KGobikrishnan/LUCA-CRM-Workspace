package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {

    @Query("SELECT l.leadId FROM Lead l ORDER BY l.leadId DESC LIMIT 1")
    String findMaxLeadId();
}
