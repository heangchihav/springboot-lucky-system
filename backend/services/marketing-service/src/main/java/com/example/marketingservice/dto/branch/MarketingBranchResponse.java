package com.example.marketingservice.dto.branch;

import com.example.marketingservice.entity.branch.MarketingBranch;

import java.time.LocalDateTime;

public class MarketingBranchResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private Boolean active;
    private Long areaId;
    private Long subAreaId;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MarketingBranchResponse fromEntity(MarketingBranch branch) {
        MarketingBranchResponse response = new MarketingBranchResponse();
        response.id = branch.getId();
        response.name = branch.getName();
        response.code = branch.getCode();
        response.description = branch.getDescription();
        response.active = branch.getActive();
        response.areaId = branch.getArea() != null ? branch.getArea().getId() : null;
        response.subAreaId = branch.getSubArea() != null ? branch.getSubArea().getId() : null;
        response.createdBy = branch.getCreatedBy();
        response.createdAt = branch.getCreatedAt();
        response.updatedAt = branch.getUpdatedAt();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public Boolean getActive() {
        return active;
    }

    public Long getAreaId() {
        return areaId;
    }

    public Long getSubAreaId() {
        return subAreaId;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
