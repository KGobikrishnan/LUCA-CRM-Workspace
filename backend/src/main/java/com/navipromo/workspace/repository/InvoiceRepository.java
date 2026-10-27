package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
}
