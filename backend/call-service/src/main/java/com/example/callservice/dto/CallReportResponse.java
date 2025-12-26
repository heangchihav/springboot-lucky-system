package com.example.callservice.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

public class CallReportResponse {

    private Long id;
    private LocalDate reportDate;
    private String createdBy;
    private LocalDateTime createdAt;
    private Map<String, Integer> entries;

    public CallReportResponse() {
    }

    public CallReportResponse(Long id, LocalDate reportDate, String createdBy, LocalDateTime createdAt, Map<String, Integer> entries) {
        this.id = id;
        this.reportDate = reportDate;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.entries = entries;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Map<String, Integer> getEntries() {
        return entries;
    }

    public void setEntries(Map<String, Integer> entries) {
        this.entries = entries;
    }
}
