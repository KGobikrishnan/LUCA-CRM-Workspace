package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.GeneralLedger;
import com.navipromo.workspace.dto.LedgerEntryDTO;
import com.navipromo.workspace.service.GeneralLedgerService;
import com.navipromo.workspace.repository.ReceiptRepository;
import com.navipromo.workspace.repository.ExpenseRepository;
import com.navipromo.workspace.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
import java.util.Comparator;
import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/general-ledgers")
@RequiredArgsConstructor
public class GeneralLedgerController {
    private final GeneralLedgerService service;
    private final ReceiptRepository receiptRepository;
    private final ExpenseRepository expenseRepository;
    private final PayrollRepository payrollRepository;

    @GetMapping
    public List<GeneralLedger> getAll() {
        return service.findAll();
    }

    @GetMapping("/report")
    public List<LedgerEntryDTO> getLedgerReport() {
        List<LedgerEntryDTO> ledger = new ArrayList<>();
        
        // Receipts -> Credits (Income)
        receiptRepository.findAll().forEach(r -> {
            LocalDate date = r.getReceivedOn() != null ? r.getReceivedOn() : (r.getCreatedAt() != null ? r.getCreatedAt().toLocalDate() : LocalDate.now());
            ledger.add(new LedgerEntryDTO(
                date,
                "Receipt",
                r.getReceiptId() != null ? r.getReceiptId() : "REC",
                r.getNotes() != null && !r.getNotes().isEmpty() ? r.getNotes() : "Payment Received",
                BigDecimal.ZERO,
                r.getAmount() != null ? r.getAmount() : BigDecimal.ZERO,
                r.getClientId(),
                r.getPaymentPurpose() != null && !r.getPaymentPurpose().isEmpty() ? r.getPaymentPurpose() : "Uncategorized Income"
            ));
        });

        // Expenses -> Debits (Loss)
        expenseRepository.findAll().forEach(e -> {
            LocalDate date = e.getIncurredOn() != null ? e.getIncurredOn() : (e.getCreatedAt() != null ? e.getCreatedAt().toLocalDate() : LocalDate.now());
            ledger.add(new LedgerEntryDTO(
                date,
                "Expense",
                e.getExpenseId() != null ? e.getExpenseId() : "EXP",
                e.getExpenseTitle() != null ? e.getExpenseTitle() : "Expense",
                e.getPayableAmount() != null ? e.getPayableAmount() : (e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO),
                BigDecimal.ZERO,
                e.getClientId(),
                e.getCategory() != null && !e.getCategory().isEmpty() ? e.getCategory() : "Uncategorized Expense"
            ));
        });

        // Payroll -> Debits (Loss)
        payrollRepository.findAll().stream()
            .filter(p -> "Completed".equalsIgnoreCase(p.getStatus()))
            .forEach(p -> {
                LocalDate date = p.getProcessedOn() != null ? p.getProcessedOn() : LocalDate.now();
                ledger.add(new LedgerEntryDTO(
                    date,
                    "Payroll",
                    p.getPayrollId() != null ? p.getPayrollId() : "PAY-" + p.getPayPeriod(),
                    p.getNotes() != null ? p.getNotes() : "Salary payout",
                    p.getNetPay() != null ? p.getNetPay() : BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    null,
                    "Payroll"
                ));
            });

        // Sort by date ascending
        ledger.sort(Comparator.comparing(LedgerEntryDTO::getDate));

        return ledger;
    }

    @GetMapping("/{id}")
    public GeneralLedger getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public GeneralLedger create(@RequestBody GeneralLedger entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public GeneralLedger update(@PathVariable UUID id, @RequestBody GeneralLedger entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
