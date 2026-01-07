package com.example.marketingservice.entity.competitor;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "marketing_competitor_assignments")
public class MarketingCompetitorAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    @NotNull
    private com.example.marketingservice.entity.area.MarketingArea area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_area_id")
    private com.example.marketingservice.entity.subarea.MarketingSubArea subArea;

    @ElementCollection
    @CollectionTable(name = "marketing_assignment_competitors", joinColumns = @JoinColumn(name = "assignment_id"))
    @MapKeyColumn(name = "competitor_id")
    private Map<Long, CompetitorProfile> competitorProfiles = new HashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    public MarketingCompetitorAssignment() {
    }

    public MarketingCompetitorAssignment(
            com.example.marketingservice.entity.area.MarketingArea area,
            com.example.marketingservice.entity.subarea.MarketingSubArea subArea,
            Map<Long, CompetitorProfile> competitorProfiles,
            Long createdBy) {
        this.area = area;
        this.subArea = subArea;
        this.competitorProfiles = competitorProfiles;
        this.createdBy = createdBy;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public com.example.marketingservice.entity.area.MarketingArea getArea() {
        return area;
    }

    public void setArea(com.example.marketingservice.entity.area.MarketingArea area) {
        this.area = area;
    }

    public com.example.marketingservice.entity.subarea.MarketingSubArea getSubArea() {
        return subArea;
    }

    public void setSubArea(com.example.marketingservice.entity.subarea.MarketingSubArea subArea) {
        this.subArea = subArea;
    }

    public Map<Long, CompetitorProfile> getCompetitorProfiles() {
        return competitorProfiles;
    }

    public void setCompetitorProfiles(Map<Long, CompetitorProfile> competitorProfiles) {
        this.competitorProfiles = competitorProfiles;
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
