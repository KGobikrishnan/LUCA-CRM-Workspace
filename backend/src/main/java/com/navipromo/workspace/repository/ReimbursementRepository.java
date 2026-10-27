package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Reimbursement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ReimbursementRepository extends JpaRepository<Reimbursement, UUID> {
}
