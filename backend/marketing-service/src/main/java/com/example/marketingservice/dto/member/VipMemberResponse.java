package com.example.marketingservice.dto.member;

import com.example.marketingservice.entity.member.VipMember;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class VipMemberResponse {

    private Long id;
    private String name;
    private String phone;
    private LocalDate memberCreatedAt;
    private LocalDate memberDeletedAt;
    private String createRemark;
    private String deleteRemark;
    private Long branchId;
    private String branchName;
    private Long subAreaId;
    private String subAreaName;
    private Long areaId;
    private String areaName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;

    public static VipMemberResponse fromEntity(VipMember member) {
        VipMemberResponse response = new VipMemberResponse();
        response.id = member.getId();
        response.name = member.getName();
        response.phone = member.getPhone();
        response.memberCreatedAt = member.getMemberCreatedAt();
        response.memberDeletedAt = member.getMemberDeletedAt();
        response.createRemark = member.getCreateRemark();
        response.deleteRemark = member.getDeleteRemark();

        if (member.getBranch() != null) {
            response.branchId = member.getBranch().getId();
            response.branchName = member.getBranch().getName();

            if (member.getBranch().getSubArea() != null) {
                response.subAreaId = member.getBranch().getSubArea().getId();
                response.subAreaName = member.getBranch().getSubArea().getName();
            }

            if (member.getBranch().getArea() != null) {
                response.areaId = member.getBranch().getArea().getId();
                response.areaName = member.getBranch().getArea().getName();
            }
        }

        response.createdAt = member.getCreatedAt();
        response.updatedAt = member.getUpdatedAt();
        response.createdBy = member.getCreatedBy();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public LocalDate getMemberCreatedAt() {
        return memberCreatedAt;
    }

    public LocalDate getMemberDeletedAt() {
        return memberDeletedAt;
    }

    public String getCreateRemark() {
        return createRemark;
    }

    public String getDeleteRemark() {
        return deleteRemark;
    }

    public Long getBranchId() {
        return branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public Long getSubAreaId() {
        return subAreaId;
    }

    public String getSubAreaName() {
        return subAreaName;
    }

    public Long getAreaId() {
        return areaId;
    }

    public String getAreaName() {
        return areaName;
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
}
