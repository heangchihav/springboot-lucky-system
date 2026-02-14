package com.example.marketingservice.dto.problem;

import com.example.marketingservice.entity.problem.MarketingProblem;

import java.time.LocalDateTime;

public class MarketingProblemResponse {

    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;

    public MarketingProblemResponse() {
    }

    public MarketingProblemResponse(Long id, String name, LocalDateTime createdAt, LocalDateTime updatedAt, Long createdBy) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
    }

    public static MarketingProblemResponse fromEntity(MarketingProblem problem) {
        return new MarketingProblemResponse(
                problem.getId(),
                problem.getName(),
                problem.getCreatedAt(),
                problem.getUpdatedAt(),
                problem.getCreatedBy()
        );
    }

    // Getters and setters

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
