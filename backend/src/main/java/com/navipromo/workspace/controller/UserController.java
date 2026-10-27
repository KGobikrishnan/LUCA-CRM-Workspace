package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.User;
import com.navipromo.workspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> {
            u.setHasAccess(u.getPasswordHash() != null && !u.getPasswordHash().isEmpty());
        });
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setHasAccess(user.getPasswordHash() != null && !user.getPasswordHash().isEmpty());
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        
        // Auto-generate Employee ID: NP-EMP-001 style
        Optional<User> topUser = userRepository.findTopByOrderByEmployeeIdDesc();
        String maxId = topUser.map(User::getEmployeeId).orElse(null);
        String nextId = generateNextEmployeeId(maxId);
        user.setEmployeeId(nextId);
        
        // Encode default password if not provided
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode("Welcome@123"));
        } else {
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        }
        
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @RequestBody User userDetails) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setFullName(userDetails.getFullName());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setJobType(userDetails.getJobType());
        user.setDepartment(userDetails.getDepartment());
        user.setMonthlySalary(userDetails.getMonthlySalary());
        user.setDesignation(userDetails.getDesignation());
        user.setPhone(userDetails.getPhone());
        user.setAdhaarNumber(userDetails.getAdhaarNumber());
        user.setResidentialAddress(userDetails.getResidentialAddress());
        user.setCity(userDetails.getCity());
        user.setParentGuardianName(userDetails.getParentGuardianName());
        user.setEmergencyPhone(userDetails.getEmergencyPhone());
        user.setBloodGroup(userDetails.getBloodGroup());
        user.setBankName(userDetails.getBankName());
        user.setBranchName(userDetails.getBranchName());
        user.setAccountHolderName(userDetails.getAccountHolderName());
        user.setAccountNumber(userDetails.getAccountNumber());
        user.setIfscCode(userDetails.getIfscCode());
        user.setUpiId(userDetails.getUpiId());
        user.setProfilePhoto(userDetails.getProfilePhoto());
        user.setIsActive(userDetails.getIsActive());
        
        if (userDetails.getPasswordHash() != null && !userDetails.getPasswordHash().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(userDetails.getPasswordHash()));
        }

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PostMapping("/{id}/access")
    public ResponseEntity<Map<String, String>> grantAccess(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String password = request.get("password");
        if (password == null || password.isEmpty()) {
            throw new RuntimeException("Password cannot be empty");
        }
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Access granted"));
    }

    @DeleteMapping("/{id}/access")
    public ResponseEntity<Map<String, String>> revokeAccess(@PathVariable UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Access revoked"));
    }

    private String generateNextEmployeeId(String maxId) {
        if (maxId == null || !maxId.startsWith("NP-EMP-")) {
            return "NP-EMP-001";
        }
        try {
            int currentNum = Integer.parseInt(maxId.substring(7));
            return String.format("NP-EMP-%03d", currentNum + 1);
        } catch (Exception e) {
            return "NP-EMP-001";
        }
    }
}
