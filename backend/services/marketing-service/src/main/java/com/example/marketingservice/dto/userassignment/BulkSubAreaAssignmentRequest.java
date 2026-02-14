package com.example.marketingservice.dto.userassignment;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class BulkSubAreaAssignmentRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotEmpty(message = "Sub-area IDs list cannot be empty")
    private List<Long> subAreaIds;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<Long> getSubAreaIds() {
        return subAreaIds;
    }

    public void setSubAreaIds(List<Long> subAreaIds) {
        this.subAreaIds = subAreaIds;
    }
}
