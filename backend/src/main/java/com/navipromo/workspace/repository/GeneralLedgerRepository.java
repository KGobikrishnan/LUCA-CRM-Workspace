package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.GeneralLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface GeneralLedgerRepository extends JpaRepository<GeneralLedger, UUID> {
}
