package com.example.marketingservice.dto.user;

import jakarta.validation.constraints.Size;

public class MarketingUserProfileRequest {

    @Size(max = 120)
    private String departmentManager;

    @Size(max = 120)
    private String managerName;

    private String userSignature;

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
}
