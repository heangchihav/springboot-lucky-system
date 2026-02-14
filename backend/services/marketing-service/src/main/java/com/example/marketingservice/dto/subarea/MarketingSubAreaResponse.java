package com.example.marketingservice.dto.subarea;

import com.example.marketingservice.entity.subarea.MarketingSubArea;

import java.time.LocalDateTime;

public class MarketingSubAreaResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private Boolean active;
    private Long areaId;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MarketingSubAreaResponse fromEntity(MarketingSubArea subArea) {
        MarketingSubAreaResponse response = new MarketingSubAreaResponse();
        response.id = subArea.getId();
        response.name = subArea.getName();
        response.code = subArea.getCode();
        response.description = subArea.getDescription();
        response.active = subArea.getActive();
        response.areaId = subArea.getArea() != null ? subArea.getArea().getId() : null;
        response.createdBy = subArea.getCreatedBy();
        response.createdAt = subArea.getCreatedAt();
        response.updatedAt = subArea.getUpdatedAt();
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }
}
