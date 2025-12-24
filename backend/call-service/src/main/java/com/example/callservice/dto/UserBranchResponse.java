package com.example.callservice.dto;

import java.time.LocalDateTime;

public class UserBranchResponse {
    private Long id;
    private Long userId;
    private Long branchId;
    private String branchName;
    private Boolean active;
    private LocalDateTime assignedAt;
    private LocalDateTime updatedAt;

    public UserBranchResponse() {}

    public UserBranchResponse(Long id, Long userId, Long branchId, String branchName, Boolean active, LocalDateTime assignedAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.branchId = branchId;
        this.branchName = branchName;
        this.active = active;
        this.assignedAt = assignedAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
