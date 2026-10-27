package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.PasswordVault;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface PasswordVaultRepository extends JpaRepository<PasswordVault, UUID> {
    @Modifying
    @Query("DELETE FROM PasswordVault p WHERE p.client.id = :clientId")
    void deleteByClientId(@Param("clientId") UUID clientId);
}
