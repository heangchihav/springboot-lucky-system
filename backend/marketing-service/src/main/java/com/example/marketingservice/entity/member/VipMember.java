package com.example.marketingservice.entity.member;

import com.example.marketingservice.entity.branch.MarketingBranch;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_vip_members", uniqueConstraints = {
        @UniqueConstraint(name = "uk_vip_member_phone", columnNames = "phone")
}, indexes = {
        @Index(name = "idx_vip_member_branch_id", columnList = "branch_id"),
        @Index(name = "idx_vip_member_created_at", columnList = "member_created_at"),
        @Index(name = "idx_vip_member_deleted_at", columnList = "member_deleted_at"),
        @Index(name = "idx_vip_member_branch_created", columnList = "branch_id, member_created_at"),
        @Index(name = "idx_vip_member_active_created", columnList = "member_deleted_at, member_created_at")
})
public class VipMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String name;

    @NotBlank
    @Size(max = 40)
    @Column(nullable = false, length = 40)
    private String phone;

    @NotNull
    @Column(name = "member_created_at", nullable = false)
    private LocalDate memberCreatedAt;

    @Column(name = "member_deleted_at")
    private LocalDate memberDeletedAt;

    @Size(max = 500)
    @Column(name = "create_remark", length = 500)
    private String createRemark;

    @Size(max = 500)
    @Column(name = "delete_remark", length = 500)
    private String deleteRemark;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private MarketingBranch branch;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.memberCreatedAt == null) {
            this.memberCreatedAt = now.toLocalDate();
        }
        // Normalize phone number by removing spaces
        if (this.phone != null) {
            this.phone = this.phone.replaceAll("\\s", "");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        // Normalize phone number by removing spaces
        if (this.phone != null) {
            this.phone = this.phone.replaceAll("\\s", "");
        }
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDate getMemberCreatedAt() {
        return memberCreatedAt;
    }

    public void setMemberCreatedAt(LocalDate memberCreatedAt) {
        this.memberCreatedAt = memberCreatedAt;
    }

    public LocalDate getMemberDeletedAt() {
        return memberDeletedAt;
    }

    public void setMemberDeletedAt(LocalDate memberDeletedAt) {
        this.memberDeletedAt = memberDeletedAt;
    }

    public String getCreateRemark() {
        return createRemark;
    }

    public void setCreateRemark(String createRemark) {
        this.createRemark = createRemark;
    }

    public String getDeleteRemark() {
        return deleteRemark;
    }

    public void setDeleteRemark(String deleteRemark) {
        this.deleteRemark = deleteRemark;
    }

    public MarketingBranch getBranch() {
        return branch;
    }

    public void setBranch(MarketingBranch branch) {
        this.branch = branch;
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
