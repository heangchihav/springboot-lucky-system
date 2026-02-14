package com.example.marketingservice.dto.userassignment;

import com.example.marketingservice.entity.userassignment.MarketingUserAssignment;

import java.time.LocalDateTime;

public class MarketingUserAssignmentResponse {

    private Long id;
    private Long userId;
    private Long areaId;
    private String areaName;
    private Long subAreaId;
    private String subAreaName;
    private Long branchId;
    private String branchName;
    private Boolean active;
    private LocalDateTime assignedAt;
    private LocalDateTime updatedAt;
    private String assignmentType;

    public MarketingUserAssignmentResponse() {
    }

    public static MarketingUserAssignmentResponse fromEntity(MarketingUserAssignment assignment) {
        MarketingUserAssignmentResponse response = new MarketingUserAssignmentResponse();
        response.setId(assignment.getId());
        response.setUserId(assignment.getUserId());
        response.setActive(assignment.getActive());
        response.setAssignedAt(assignment.getAssignedAt());
        response.setUpdatedAt(assignment.getUpdatedAt());

        if (assignment.getBranch() != null) {
            response.setBranchId(assignment.getBranch().getId());
            response.setBranchName(assignment.getBranch().getName());
            response.setAssignmentType("BRANCH");

            if (assignment.getBranch().getSubArea() != null) {
                response.setSubAreaId(assignment.getBranch().getSubArea().getId());
                response.setSubAreaName(assignment.getBranch().getSubArea().getName());
            }
            if (assignment.getBranch().getArea() != null) {
                response.setAreaId(assignment.getBranch().getArea().getId());
                response.setAreaName(assignment.getBranch().getArea().getName());
            }
        } else if (assignment.getSubArea() != null) {
            response.setSubAreaId(assignment.getSubArea().getId());
            response.setSubAreaName(assignment.getSubArea().getName());
            response.setAssignmentType("SUB_AREA");

            if (assignment.getSubArea().getArea() != null) {
                response.setAreaId(assignment.getSubArea().getArea().getId());
                response.setAreaName(assignment.getSubArea().getArea().getName());
            }
        } else if (assignment.getArea() != null) {
            response.setAreaId(assignment.getArea().getId());
            response.setAreaName(assignment.getArea().getName());
            response.setAssignmentType("AREA");
        }

        return response;
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

    public String getAssignmentType() {
        return assignmentType;
    }

    public void setAssignmentType(String assignmentType) {
        this.assignmentType = assignmentType;
    }
}
