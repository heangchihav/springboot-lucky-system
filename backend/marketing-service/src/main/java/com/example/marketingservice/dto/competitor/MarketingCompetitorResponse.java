package com.example.marketingservice.dto.competitor;

import com.example.marketingservice.entity.competitor.MarketingCompetitor;

import java.time.LocalDateTime;

public class MarketingCompetitorResponse {

    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;

    public MarketingCompetitorResponse() {
    }

    public MarketingCompetitorResponse(Long id, String name, LocalDateTime createdAt, LocalDateTime updatedAt, Long createdBy) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
    }

    public static MarketingCompetitorResponse fromEntity(MarketingCompetitor competitor) {
        return new MarketingCompetitorResponse(
                competitor.getId(),
                competitor.getName(),
                competitor.getCreatedAt(),
                competitor.getUpdatedAt(),
                competitor.getCreatedBy()
        );
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

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
