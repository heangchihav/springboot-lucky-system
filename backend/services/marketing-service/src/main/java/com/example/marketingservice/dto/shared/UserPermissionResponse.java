package com.example.marketingservice.dto.shared;

import java.time.LocalDateTime;

public class UserPermissionResponse {

    private Long id;
    private Long userId;
    private Long permissionId;
    private String permissionCode;
    private String permissionName;
    private String permissionDescription;
    private Boolean active;
    private String assignedBy;
    private LocalDateTime assignedAt;
    private LocalDateTime updatedAt;

    public UserPermissionResponse() {
    }

    public UserPermissionResponse(Long id, Long userId, Long permissionId, String permissionCode, String permissionName,
            String permissionDescription, Boolean active, String assignedBy, LocalDateTime assignedAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.permissionId = permissionId;
        this.permissionCode = permissionCode;
        this.permissionName = permissionName;
        this.permissionDescription = permissionDescription;
        this.active = active;
        this.assignedBy = assignedBy;
        this.assignedAt = assignedAt;
        this.updatedAt = updatedAt;
    }

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

    public Long getPermissionId() {
        return permissionId;
    }

    public void setPermissionId(Long permissionId) {
        this.permissionId = permissionId;
    }

    public String getPermissionCode() {
        return permissionCode;
    }

    public void setPermissionCode(String permissionCode) {
        this.permissionCode = permissionCode;
    }

    public String getPermissionName() {
        return permissionName;
    }

    public void setPermissionName(String permissionName) {
        this.permissionName = permissionName;
    }

    public String getPermissionDescription() {
        return permissionDescription;
    }

    public void setPermissionDescription(String permissionDescription) {
        this.permissionDescription = permissionDescription;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
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
