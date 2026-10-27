package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.ServiceCatalog;
import com.navipromo.workspace.repository.ServiceCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {
    private final ServiceCatalogRepository repository;

    public List<ServiceCatalog> findAll() {
        return repository.findAll();
    }

    public ServiceCatalog findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("ServiceCatalog not found"));
    }

    public ServiceCatalog save(ServiceCatalog entity) {
        if (entity.getServiceId() == null || entity.getServiceId().isEmpty()) {
            String prefix = "";
            if ("Digital Marketing".equalsIgnoreCase(entity.getCategory())) {
                prefix = "NP-DM-";
            } else if ("Development".equalsIgnoreCase(entity.getCategory())) {
                prefix = "NP-DV-";
            } else if ("Promotion Kit".equalsIgnoreCase(entity.getCategory())) {
                prefix = "NP-PK-";
            }

            if (!prefix.isEmpty()) {
                Optional<ServiceCatalog> lastService = repository.findTopByCategoryOrderByServiceIdDesc(entity.getCategory());
                int nextNum = 1;
                if (lastService.isPresent() && lastService.get().getServiceId() != null) {
                    String lastId = lastService.get().getServiceId();
                    try {
                        String numStr = lastId.substring(prefix.length());
                        nextNum = Integer.parseInt(numStr) + 1;
                    } catch (Exception e) {
                        // fallback to 1 if parsing fails
                    }
                }
                entity.setServiceId(prefix + String.format("%02d", nextNum));
            }
        }
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
