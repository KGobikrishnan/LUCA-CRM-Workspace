package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface QuotationRepository extends JpaRepository<Quotation, UUID> {
}
