package com.example.marketingservice.controller;

import com.example.marketingservice.dto.schedule.WeeklyScheduleRequest;
import com.example.marketingservice.dto.schedule.WeeklyScheduleResponse;
import com.example.marketingservice.service.schedule.WeeklyScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketing/weekly-schedules")
public class WeeklyScheduleController {

    @Autowired
    private WeeklyScheduleService weeklyScheduleService;

    @GetMapping("/generate-month")
    public ResponseEntity<List<WeeklyScheduleResponse>> generateMonth(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        List<WeeklyScheduleResponse> weeks = weeklyScheduleService.generateBusinessMonth(year, month);
        return ResponseEntity.ok(weeks);
    }

    @PostMapping
    public ResponseEntity<WeeklyScheduleResponse> createSchedule(@RequestBody WeeklyScheduleRequest request) {
        // For now, use a hardcoded user ID - this should be replaced with proper
        // authentication
        Long currentUserId = 1L;

        WeeklyScheduleResponse response = weeklyScheduleService.createSchedule(request, currentUserId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WeeklyScheduleResponse> updateSchedule(
            @PathVariable Long id,
            @RequestBody WeeklyScheduleRequest request) {
        try {
            WeeklyScheduleResponse response = weeklyScheduleService.updateSchedule(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WeeklyScheduleResponse>> getUserSchedules(
            @PathVariable Long userId,
            @RequestParam Integer year,
            @RequestParam Integer month) {
        List<WeeklyScheduleResponse> schedules = weeklyScheduleService.getUserSchedules(userId, year, month);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping
    public ResponseEntity<List<WeeklyScheduleResponse>> getAllSchedules(
            @RequestParam Integer year,
            @RequestParam Integer month,
            @RequestParam(required = false) Long userId) {
        List<WeeklyScheduleResponse> schedules = weeklyScheduleService.getAllSchedules(year, month, userId);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WeeklyScheduleResponse> getSchedule(@PathVariable Long id) {
        try {
            WeeklyScheduleResponse response = weeklyScheduleService.getSchedule(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        try {
            weeklyScheduleService.deleteSchedule(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
