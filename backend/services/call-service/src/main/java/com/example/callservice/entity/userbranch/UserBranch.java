package com.example.callservice.entity.userbranch;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import com.example.callservice.entity.branch.Branch;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_branches")
public class UserBranch {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "User ID is required")
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @NotNull(message = "Branch is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;
    
    @Column(name = "active", nullable = false)
    private Boolean active = true;
    
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public UserBranch() {}
    
    public UserBranch(Long userId, Branch branch) {
        this.userId = userId;
        this.branch = branch;
    }
    
    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
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
    
    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "UserBranch{" +
                "id=" + id +
                ", userId=" + userId +
                ", branch=" + (branch != null ? branch.getName() : "null") +
                ", active=" + active +
                '}';
    }
}
