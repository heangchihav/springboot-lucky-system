package com.example.marketingservice.dto.area;

import com.example.marketingservice.entity.area.MarketingArea;

import java.time.LocalDateTime;

public class MarketingAreaResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;

    public static MarketingAreaResponse fromEntity(MarketingArea area) {
        MarketingAreaResponse response = new MarketingAreaResponse();
        response.id = area.getId();
        response.name = area.getName();
        response.code = area.getCode();
        response.description = area.getDescription();
        response.active = area.getActive();
        response.createdAt = area.getCreatedAt();
        response.updatedAt = area.getUpdatedAt();
        response.createdBy = area.getCreatedBy();
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
