package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Receipt;
import com.navipromo.workspace.entity.Invoice;
import com.navipromo.workspace.repository.InvoiceRepository;
import com.navipromo.workspace.repository.ReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReceiptService {
    private final ReceiptRepository repository;
    private final InvoiceRepository invoiceRepository;

    public List<Receipt> findAll() {
        return repository.findAll();
    }

    public Receipt findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Receipt not found"));
    }

    public Receipt save(Receipt entity) {
        if (entity.getReceiptId() == null || entity.getReceiptId().isEmpty() || entity.getReceiptId().startsWith("Auto-generated")) {
            Optional<Receipt> lastReceipt = repository.findTopByOrderByReceiptIdDesc();
            int nextNum = 1;
            if (lastReceipt.isPresent() && lastReceipt.get().getReceiptId() != null && lastReceipt.get().getReceiptId().startsWith("NP-RC-")) {
                try {
                    String numStr = lastReceipt.get().getReceiptId().substring(6);
                    nextNum = Integer.parseInt(numStr) + 1;
                } catch (Exception e) {
                    // Fallback to 1 if parsing fails
                }
            }
            entity.setReceiptId(String.format("NP-RC-%03d", nextNum));
        }

        // If this receipt is linked to an invoice, update the invoice's amount paid
        if (Boolean.TRUE.equals(entity.getIsLinkedToInvoice()) && entity.getInvoiceId() != null) {
            Optional<Invoice> optInvoice = invoiceRepository.findById(entity.getInvoiceId());
            if (optInvoice.isPresent()) {
                Invoice invoice = optInvoice.get();
                
                // Add receipt amount to invoice paid amount
                java.math.BigDecimal currentPaid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal newPaid = currentPaid.add(entity.getAmount());
                invoice.setAmountPaid(newPaid);
                
                // Update payment status
                java.math.BigDecimal total = invoice.getTotal() != null ? invoice.getTotal() : java.math.BigDecimal.ZERO;
                if (newPaid.compareTo(total) >= 0) {
                    invoice.setPaymentStatus("Paid");
                } else if (newPaid.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    invoice.setPaymentStatus("Partial");
                }
                
                // Snapshot values into receipt
                entity.setInvoiceTotal(total);
                entity.setInvoiceBalance(total.subtract(newPaid).max(java.math.BigDecimal.ZERO));
                
                invoiceRepository.save(invoice);
            }
        }

        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
