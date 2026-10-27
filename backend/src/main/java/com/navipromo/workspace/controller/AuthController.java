package com.navipromo.workspace.controller;

import com.navipromo.workspace.dto.AuthRequest;
import com.navipromo.workspace.entity.User;
import com.navipromo.workspace.repository.UserRepository;
import com.navipromo.workspace.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwt = jwtUtil.generateToken(userDetails);

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Build a safe user object without passwordHash
            Map<String, Object> safeUser = new HashMap<>();
            safeUser.put("id", user.getId());
            safeUser.put("employeeId", user.getEmployeeId());
            safeUser.put("fullName", user.getFullName());
            safeUser.put("email", user.getEmail());
            safeUser.put("role", user.getRole());
            safeUser.put("designation", user.getDesignation());
            safeUser.put("phone", user.getPhone());
            safeUser.put("city", user.getCity());
            safeUser.put("isActive", user.getIsActive());

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", safeUser);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Login failed for email: " + request.getEmail());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials", "details", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        if (user.getEmployeeId() == null) {
            user.setEmployeeId("EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        User savedUser = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }
}
