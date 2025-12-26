package com.example.callservice.entity.shared;

import jakarta.persistence.*;
import com.example.callservice.entity.permission.Permission;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_service_user_permissions")
public class UserPermission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(name = "assigned_by", length = 100)
    private String assignedBy;
    
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (assignedBy == null) {
            assignedBy = "system";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public UserPermission() {}
    
    public UserPermission(Long userId, Permission permission) {
        this.userId = userId;
        this.permission = permission;
    }
    
    public UserPermission(Long userId, Permission permission, String assignedBy) {
        this.userId = userId;
        this.permission = permission;
        this.assignedBy = assignedBy;
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
    
    public Permission getPermission() {
        return permission;
    }
    
    public void setPermission(Permission permission) {
        this.permission = permission;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
    }
    
    public String getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
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
}
