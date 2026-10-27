package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Client;
import com.navipromo.workspace.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {
    private final ClientService service;

    @GetMapping
    public List<Client> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Client getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public Client create(@RequestBody Client entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public Client update(@PathVariable UUID id, @RequestBody Client entity) {
        entity.setId(id);
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.deleteById(id);
    }
}
