package com.example.callservice.dto.branch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BranchDTO {

    private Long id;

    @NotBlank(message = "Branch name is required")
    @Size(max = 100, message = "Branch name must not exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private String code;

    private String address;

    private String phone;

    private String email;

    @NotNull(message = "Subarea ID is required")
    private Long subareaId;

    private String subareaName;

    private String areaName; // Keep for display purposes

    private Boolean active;

    private Long userCount;

    // Constructors
    public BranchDTO() {
    }

    public BranchDTO(String name, String description, String code, Long subareaId) {
        this.name = name;
        this.description = description;
        this.code = code;
        this.subareaId = subareaId;
        this.active = true;
    }

    // Getters and Setters
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getSubareaId() {
        return subareaId;
    }

    public void setSubareaId(Long subareaId) {
        this.subareaId = subareaId;
    }

    public String getSubareaName() {
        return subareaName;
    }

    public void setSubareaName(String subareaName) {
        this.subareaName = subareaName;
    }

    public String getAreaName() {
        return areaName;
    }

    public void setAreaName(String areaName) {
        this.areaName = areaName;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Long getUserCount() {
        return userCount;
    }

    public void setUserCount(Long userCount) {
        this.userCount = userCount;
    }
}
