package com.example.marketingservice.dto.userassignment;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class BulkBranchAssignmentRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotEmpty(message = "Branch IDs list cannot be empty")
    private List<Long> branchIds;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<Long> getBranchIds() {
        return branchIds;
    }

    public void setBranchIds(List<Long> branchIds) {
        this.branchIds = branchIds;
    }
}
