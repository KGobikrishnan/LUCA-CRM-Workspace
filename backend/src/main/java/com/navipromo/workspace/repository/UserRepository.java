package com.navipromo.workspace.repository;

import com.navipromo.workspace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeId(String employeeId);

    Optional<User> findTopByOrderByEmployeeIdDesc();
}
