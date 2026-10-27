package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;

public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {
    Optional<Receipt> findTopByOrderByReceiptIdDesc();
}
