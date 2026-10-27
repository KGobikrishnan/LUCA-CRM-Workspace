package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.SupportTicket;
import com.navipromo.workspace.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/support-tickets")
@RequiredArgsConstructor
public class SupportTicketController {
    private final SupportTicketService service;

    @GetMapping
    public List<SupportTicket> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public SupportTicket getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public SupportTicket create(@RequestBody SupportTicket entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public SupportTicket update(@PathVariable UUID id, @RequestBody SupportTicket entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
