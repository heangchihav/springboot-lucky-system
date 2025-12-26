package com.example.callservice.entity.area;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import com.example.callservice.entity.branch.Branch;

@Entity
@Table(name = "areas")
public class Area {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Area name is required")
    @Size(max = 100, message = "Area name must not exceed 100 characters")
    @Column(name = "name", nullable = false, unique = true)
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Column(name = "description")
    private String description;
    
    @Column(name = "code", unique = true)
    private String code;
    
    @Column(name = "active", nullable = false)
    private Boolean active = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "area", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Branch> branches;
    
    public Area() {}
    
    public Area(String name, String description, String code) {
        this.name = name;
        this.description = description;
        this.code = code;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
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
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
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
    
    public List<Branch> getBranches() {
        return branches;
    }
    
    public void setBranches(List<Branch> branches) {
        this.branches = branches;
    }
    
    @Override
    public String toString() {
        return "Area{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", code='" + code + '\'' +
                ", active=" + active +
                '}';
    }
}
