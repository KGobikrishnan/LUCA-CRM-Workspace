package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

public interface PayrollRepository extends JpaRepository<Payroll, UUID> {
    List<Payroll> findByPayPeriod(String payPeriod);
    boolean existsByUserIdAndPayPeriod(UUID userId, String payPeriod);
    Optional<Payroll> findByUserIdAndPayPeriod(UUID userId, String payPeriod);
}
