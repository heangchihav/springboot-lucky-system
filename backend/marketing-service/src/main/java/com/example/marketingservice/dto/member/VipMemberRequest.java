package com.example.marketingservice.dto.member;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class VipMemberRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Size(max = 40)
    private String phone;

    @NotNull
    private Long branchId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate memberCreatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate memberDeletedAt;

    @Size(max = 500)
    private String createRemark;

    @Size(max = 500)
    private String deleteRemark;

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

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
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
}
