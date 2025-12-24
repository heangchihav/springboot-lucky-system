package com.example.callservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public class RoleResponse {
    private Long id;
    private String name;
    private String description;
    private List<PermissionResponse> permissions;
    private Integer userCount;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public RoleResponse() {}
    
    public RoleResponse(Long id, String name, String description, List<PermissionResponse> permissions, Integer userCount, Boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.permissions = permissions;
        this.userCount = userCount;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public List<PermissionResponse> getPermissions() {
        return permissions;
    }
    
    public void setPermissions(List<PermissionResponse> permissions) {
        this.permissions = permissions;
    }
    
    public Integer getUserCount() {
        return userCount;
    }
    
    public void setUserCount(Integer userCount) {
        this.userCount = userCount;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
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
}
