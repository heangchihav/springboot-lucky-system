package com.example.marketingservice.entity.userassignment;

import com.example.marketingservice.entity.area.MarketingArea;
import com.example.marketingservice.entity.subarea.MarketingSubArea;
import com.example.marketingservice.entity.branch.MarketingBranch;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_user_assignments")
public class MarketingUserAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id")
    private MarketingArea area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_area_id")
    private MarketingSubArea subArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private MarketingBranch branch;

    @NotNull
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "assigned_by")
    private Long assignedBy;

    public MarketingUserAssignment() {
    }

    public MarketingUserAssignment(Long userId, MarketingArea area) {
        this.userId = userId;
        this.area = area;
        this.active = true;
    }

    public MarketingUserAssignment(Long userId, MarketingSubArea subArea) {
        this.userId = userId;
        this.subArea = subArea;
        if (subArea != null) {
            this.area = subArea.getArea();
        }
        this.active = true;
    }

    public MarketingUserAssignment(Long userId, MarketingBranch branch) {
        this.userId = userId;
        this.branch = branch;
        if (branch != null) {
            this.subArea = branch.getSubArea();
            this.area = branch.getArea();
        }
        this.active = true;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.assignedAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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

    public MarketingArea getArea() {
        return area;
    }

    public void setArea(MarketingArea area) {
        this.area = area;
    }

    public MarketingSubArea getSubArea() {
        return subArea;
    }

    public void setSubArea(MarketingSubArea subArea) {
        this.subArea = subArea;
    }

    public MarketingBranch getBranch() {
        return branch;
    }

    public void setBranch(MarketingBranch branch) {
        this.branch = branch;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Long getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(Long assignedBy) {
        this.assignedBy = assignedBy;
    }
}
