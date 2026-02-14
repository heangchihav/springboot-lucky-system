package com.example.callservice.dto.userassignment;

import jakarta.validation.constraints.NotNull;

public class CallUserAssignmentRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    private Long areaId;
    private Long subAreaId;
    private Long branchId;

    public CallUserAssignmentRequest() {
    }

    public CallUserAssignmentRequest(Long userId, Long areaId, Long subAreaId, Long branchId) {
        this.userId = userId;
        this.areaId = areaId;
        this.subAreaId = subAreaId;
        this.branchId = branchId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    public Long getSubAreaId() {
        return subAreaId;
    }

    public void setSubAreaId(Long subAreaId) {
        this.subAreaId = subAreaId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }
}
