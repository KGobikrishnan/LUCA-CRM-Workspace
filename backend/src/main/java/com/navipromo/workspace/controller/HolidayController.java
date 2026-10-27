package com.navipromo.workspace.controller;

import com.navipromo.workspace.entity.Holiday;
import com.navipromo.workspace.service.HolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
public class HolidayController {
    private final HolidayService service;

    @GetMapping
    public List<Holiday> getAll() {
        return service.findAll();
    }

    @GetMapping("/range")
    public List<Holiday> getRange(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
    ) {
        return service.findBetween(start, end);
    }

    @PostMapping
    public ResponseEntity<Holiday> create(@RequestBody Holiday holiday) {
        return ResponseEntity.ok(service.save(holiday));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
