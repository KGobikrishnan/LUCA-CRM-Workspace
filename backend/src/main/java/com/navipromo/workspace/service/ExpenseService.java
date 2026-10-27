package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Expense;
import com.navipromo.workspace.entity.Payroll;
import com.navipromo.workspace.repository.ExpenseRepository;
import com.navipromo.workspace.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    private final ExpenseRepository repository;
    private final PayrollRepository payrollRepository;

    public List<Expense> findAll() {
        return repository.findAll();
    }

    public Expense findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Expense not found"));
    }

    @Transactional
    public Expense save(Expense entity) {
        if (entity.getId() != null) {
            Optional<Expense> existingOpt = repository.findById(entity.getId());
            if (existingOpt.isPresent()) {
                Expense existing = existingOpt.get();
                if ("Employee & HR".equals(existing.getCategory()) && "Salaries".equals(existing.getSpecificItem()) && existing.getUserId() != null && existing.getPayPeriod() != null) {
                    boolean changed = !"Employee & HR".equals(entity.getCategory())
                            || !"Salaries".equals(entity.getSpecificItem())
                            || !existing.getUserId().equals(entity.getUserId())
                            || !existing.getPayPeriod().equals(entity.getPayPeriod());
                    if (changed) {
                        Optional<Payroll> oldPayrollOpt = payrollRepository.findByUserIdAndPayPeriod(existing.getUserId(), existing.getPayPeriod());
                        if (oldPayrollOpt.isPresent()) {
                            Payroll oldPayroll = oldPayrollOpt.get();
                            oldPayroll.setStatus("Pending");
                            oldPayroll.setProcessedOn(null);
                            payrollRepository.save(oldPayroll);
                        }
                    }
                }
            }
        }
        if (entity.getExpenseId() == null || entity.getExpenseId().isEmpty() || entity.getExpenseId().startsWith("Auto-generated")) {
            Optional<Expense> lastExpense = repository.findTopByOrderByExpenseIdDesc();
            int nextNum = 1;
            if (lastExpense.isPresent() && lastExpense.get().getExpenseId() != null && lastExpense.get().getExpenseId().startsWith("NP-EXP-")) {
                try {
                    String numStr = lastExpense.get().getExpenseId().substring(7);
                    nextNum = Integer.parseInt(numStr) + 1;
                } catch (Exception e) {
                    // Fallback to 1
                }
            }
            entity.setExpenseId(String.format("NP-EXP-%03d", nextNum));
        }
        Expense saved = repository.save(entity);
        if ("Employee & HR".equals(saved.getCategory()) && "Salaries".equals(saved.getSpecificItem()) && saved.getUserId() != null && saved.getPayPeriod() != null) {
            syncPayroll(saved);
        }
        return saved;
    }

    @Transactional
    public void deleteById(UUID id) {
        Optional<Expense> expOpt = repository.findById(id);
        if (expOpt.isPresent()) {
            Expense expense = expOpt.get();
            if ("Employee & HR".equals(expense.getCategory()) && "Salaries".equals(expense.getSpecificItem()) && expense.getUserId() != null && expense.getPayPeriod() != null) {
                Optional<Payroll> payrollOpt = payrollRepository.findByUserIdAndPayPeriod(expense.getUserId(), expense.getPayPeriod());
                if (payrollOpt.isPresent()) {
                    Payroll payroll = payrollOpt.get();
                    payroll.setStatus("Pending");
                    payroll.setProcessedOn(null);
                    payrollRepository.save(payroll);
                }
            }
        }
        repository.deleteById(id);
    }

    private void syncPayroll(Expense expense) {
        Optional<Payroll> payrollOpt = payrollRepository.findByUserIdAndPayPeriod(expense.getUserId(), expense.getPayPeriod());
        Payroll payroll;
        if (payrollOpt.isPresent()) {
            payroll = payrollOpt.get();
        } else {
            payroll = new Payroll();
            payroll.setUserId(expense.getUserId());
            payroll.setPayPeriod(expense.getPayPeriod());
            payroll.setBasicSalary(java.math.BigDecimal.ZERO);
            payroll.setAdditions(java.math.BigDecimal.ZERO);
            payroll.setManualBonus(java.math.BigDecimal.ZERO);
            payroll.setDeductions(java.math.BigDecimal.ZERO);
        }
        payroll.setNetPay(expense.getPayableAmount());
        payroll.setStatus("Completed");
        payroll.setProcessedOn(expense.getIncurredOn());
        payroll.setNotes("Salary paid via expense ID " + expense.getExpenseId());
        payrollRepository.save(payroll);
    }
}
