package com.example.callservice.dto;

import java.time.LocalDateTime;

public class CallStatusResponse {

    private String key;
    private String label;
    private String createdBy;
    private LocalDateTime createdAt;

    public CallStatusResponse() {
    }

    public CallStatusResponse(String key, String label, String createdBy, LocalDateTime createdAt) {
        this.key = key;
        this.label = label;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
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
}
