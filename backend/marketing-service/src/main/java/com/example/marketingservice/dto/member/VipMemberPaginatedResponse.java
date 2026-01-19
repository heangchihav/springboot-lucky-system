package com.example.marketingservice.dto.member;

import com.example.marketingservice.entity.member.VipMember;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class VipMemberPaginatedResponse {
    private Long id;
    private String name;
    private String phone;
    private LocalDate memberCreatedAt;
    private LocalDate memberDeletedAt;
    private String createRemark;
    private String deleteRemark;
    private Long branchId;
    private String branchName;
    private Long areaId;
    private String areaName;
    private Long subAreaId;
    private String subAreaName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;

    public VipMemberPaginatedResponse() {
    }

    public static VipMemberPaginatedResponse fromEntity(VipMember member) {
        VipMemberPaginatedResponse response = new VipMemberPaginatedResponse();
        response.setId(member.getId());
        response.setName(member.getName());
        response.setPhone(member.getPhone());
        response.setMemberCreatedAt(member.getMemberCreatedAt());
        response.setMemberDeletedAt(member.getMemberDeletedAt());
        response.setCreateRemark(member.getCreateRemark());
        response.setDeleteRemark(member.getDeleteRemark());
        response.setCreatedAt(member.getCreatedAt());
        response.setUpdatedAt(member.getUpdatedAt());
        response.setCreatedBy(member.getCreatedBy());

        // Extract branch information
        if (member.getBranch() != null) {
            response.setBranchId(member.getBranch().getId());
            response.setBranchName(member.getBranch().getName());

            // Extract area information
            if (member.getBranch().getArea() != null) {
                response.setAreaId(member.getBranch().getArea().getId());
                response.setAreaName(member.getBranch().getArea().getName());
            }

            // Extract sub-area information
            if (member.getBranch().getSubArea() != null) {
                response.setSubAreaId(member.getBranch().getSubArea().getId());
                response.setSubAreaName(member.getBranch().getSubArea().getName());
            }
        }

        return response;
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

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    public String getAreaName() {
        return areaName;
    }

    public void setAreaName(String areaName) {
        this.areaName = areaName;
    }

    public Long getSubAreaId() {
        return subAreaId;
    }

    public void setSubAreaId(Long subAreaId) {
        this.subAreaId = subAreaId;
    }

    public String getSubAreaName() {
        return subAreaName;
    }

    public void setSubAreaName(String subAreaName) {
        this.subAreaName = subAreaName;
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
