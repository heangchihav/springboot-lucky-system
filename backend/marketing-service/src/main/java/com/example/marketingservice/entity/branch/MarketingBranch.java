package com.example.marketingservice.entity.branch;

import com.example.marketingservice.entity.area.MarketingArea;
import com.example.marketingservice.entity.member.VipMember;
import com.example.marketingservice.entity.subarea.MarketingSubArea;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "marketing_branches")
public class MarketingBranch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String name;

    @Size(max = 50)
    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Size(max = 500)
    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    @NotNull
    private MarketingArea area;

    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VipMember> vipMembers = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_area_id")
    private MarketingSubArea subArea;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    public MarketingBranch() {
    }

    public MarketingBranch(String name, String code, String description, MarketingArea area, MarketingSubArea subArea) {
        this.name = name;
        this.code = code;
        this.description = description;
        this.area = area;
        this.subArea = subArea;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<VipMember> getVipMembers() {
        return vipMembers;
    }

    public void setVipMembers(List<VipMember> vipMembers) {
        this.vipMembers = vipMembers;
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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
