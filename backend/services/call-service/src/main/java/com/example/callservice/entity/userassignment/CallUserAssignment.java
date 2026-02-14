package com.example.callservice.entity.userassignment;

import com.example.callservice.entity.area.Area;
import com.example.callservice.entity.subarea.Subarea;
import com.example.callservice.entity.branch.Branch;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "call_service_user_assignments")
public class CallUserAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id")
    private Area area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_area_id")
    private Subarea subArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @NotNull
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "assigned_by")
    private Long assignedBy;

    public CallUserAssignment() {
    }

    public CallUserAssignment(Long userId, Area area) {
        this.userId = userId;
        this.area = area;
        this.active = true;
    }

    public CallUserAssignment(Long userId, Subarea subArea) {
        this.userId = userId;
        this.subArea = subArea;
        if (subArea != null) {
            this.area = subArea.getArea();
        }
        this.active = true;
    }

    public CallUserAssignment(Long userId, Branch branch) {
        this.userId = userId;
        this.branch = branch;
        if (branch != null) {
            this.subArea = branch.getSubarea();
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

    public Area getArea() {
        return area;
    }

    public void setArea(Area area) {
        this.area = area;
    }

    public Subarea getSubArea() {
        return subArea;
    }

    public void setSubArea(Subarea subArea) {
        this.subArea = subArea;
    }

    public Branch getBranch() {
        return branch;
    }

    public void setBranch(Branch branch) {
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
