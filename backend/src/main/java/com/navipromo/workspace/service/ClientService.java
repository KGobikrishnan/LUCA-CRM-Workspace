package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Client;
import com.navipromo.workspace.repository.ClientRepository;
import com.navipromo.workspace.repository.PasswordVaultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {
    private final ClientRepository repository;
    private final PasswordVaultRepository passwordVaultRepository;

    public List<Client> findAll() {
        return repository.findAll();
    }

    public Client findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Client not found"));
    }

    public Client save(Client entity) {
        return repository.save(entity);
    }

    @Transactional
    public void deleteById(UUID id) {
        passwordVaultRepository.deleteByClientId(id);
        repository.deleteById(id);
    }
}
