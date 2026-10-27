package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.ServiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;

public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, UUID> {
    Optional<ServiceCatalog> findTopByCategoryOrderByServiceIdDesc(String category);
}
