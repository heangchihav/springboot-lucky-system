package com.example.marketingservice.dto.user;

import com.example.marketingservice.entity.user.MarketingUserProfile;

import java.time.LocalDateTime;

public class MarketingUserProfileResponse {

    private Long id;
    private Long userId;
    private String departmentManager;
    private String managerName;
    private String userSignature;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MarketingUserProfileResponse fromEntity(MarketingUserProfile profile) {
        MarketingUserProfileResponse response = new MarketingUserProfileResponse();
        response.id = profile.getId();
        response.userId = profile.getUserId();
        response.departmentManager = profile.getDepartmentManager();
        response.managerName = profile.getManagerName();
        response.userSignature = profile.getUserSignature();
        response.createdAt = profile.getCreatedAt();
        response.updatedAt = profile.getUpdatedAt();
        return response;
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

    public String getDepartmentManager() {
        return departmentManager;
    }

    public void setDepartmentManager(String departmentManager) {
        this.departmentManager = departmentManager;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getUserSignature() {
        return userSignature;
    }

    public void setUserSignature(String userSignature) {
        this.userSignature = userSignature;
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
