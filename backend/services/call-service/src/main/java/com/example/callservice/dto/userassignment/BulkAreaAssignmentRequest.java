package com.example.callservice.dto.userassignment;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class BulkAreaAssignmentRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotEmpty(message = "Area IDs list cannot be empty")
    private List<Long> areaIds;

    public BulkAreaAssignmentRequest() {
    }

    public BulkAreaAssignmentRequest(Long userId, List<Long> areaIds) {
        this.userId = userId;
        this.areaIds = areaIds;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<Long> getAreaIds() {
        return areaIds;
    }

    public void setAreaIds(List<Long> areaIds) {
        this.areaIds = areaIds;
    }
}
