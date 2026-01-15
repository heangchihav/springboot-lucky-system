package com.example.marketingservice.dto.dailyreport;

import java.time.LocalDateTime;
import java.util.List;

public class DailyReportDto {

    private String id;
    private String createdBy;
    private String createdByFullName;
    private String reportDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DailyReportItemDto> items;

    // Constructors
    public DailyReportDto() {
    }

    public DailyReportDto(String id, String createdBy, String createdByFullName, String reportDate,
            LocalDateTime createdAt, LocalDateTime updatedAt,
            List<DailyReportItemDto> items) {
        this.id = id;
        this.createdBy = createdBy;
        this.createdByFullName = createdByFullName;
        this.reportDate = reportDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.items = items;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedByFullName() {
        return createdByFullName;
    }

    public void setCreatedByFullName(String createdByFullName) {
        this.createdByFullName = createdByFullName;
    }

    public String getReportDate() {
        return reportDate;
    }

    public void setReportDate(String reportDate) {
        this.reportDate = reportDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<DailyReportItemDto> getItems() {
        return items;
    }

    public void setItems(List<DailyReportItemDto> items) {
        this.items = items;
    }

    // Inner class for items
    public static class DailyReportItemDto {
        private String name;
        private List<String> values;

        public DailyReportItemDto() {
        }

        public DailyReportItemDto(String name, List<String> values) {
            this.name = name;
            this.values = values;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public List<String> getValues() {
            return values;
        }

        public void setValues(List<String> values) {
            this.values = values;
        }
    }
}
