package com.navipromo.workspace.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping("/finance")
    public Map<String, Object> getFinanceMetrics() {
        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", 2450000);
        response.put("netProfit", 840000);
        response.put("expenses", 320000);
        response.put("pendingDue", 115000);

        // Dummy data for Recharts (e.g. monthly revenue)
        response.put("chartData", new Object[]{
                Map.of("name", "Jan", "revenue", 400000),
                Map.of("name", "Feb", "revenue", 300000),
                Map.of("name", "Mar", "revenue", 500000),
                Map.of("name", "Apr", "revenue", 200000),
                Map.of("name", "May", "revenue", 278000),
                Map.of("name", "Jun", "revenue", 189000),
                Map.of("name", "Jul", "revenue", 583000)
        });

        return response;
    }

    @GetMapping("/work")
    public Map<String, Object> getWorkMetrics() {
        Map<String, Object> response = new HashMap<>();
        response.put("activeProjects", 12);
        response.put("taskVelocity", 45);
        response.put("supportTickets", 3);
        return response;
    }
}
