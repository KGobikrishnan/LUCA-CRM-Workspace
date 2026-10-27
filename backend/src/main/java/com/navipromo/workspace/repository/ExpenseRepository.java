package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    Optional<Expense> findTopByOrderByExpenseIdDesc();
}
