package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Invoice;
import com.navipromo.workspace.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {
    private final InvoiceRepository repository;

    public List<Invoice> findAll() {
        return repository.findAll();
    }

    public Invoice findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Invoice not found"));
    }

    public Invoice save(Invoice entity) {
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
