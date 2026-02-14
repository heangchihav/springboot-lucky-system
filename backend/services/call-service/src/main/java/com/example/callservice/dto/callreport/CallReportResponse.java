package com.example.callservice.dto.callreport;

import com.example.callservice.entity.callreport.CallType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

public class CallReportResponse {

    private Long id;
    private LocalDate calledAt;
    private LocalDate arrivedAt;
    private CallType type;
    private Long branchId;
    private String branchName;
    private String createdBy;
    private LocalDateTime createdAt;
    private Map<String, Integer> entries;
    private Map<String, String> remarks;
    private String remark;

    public CallReportResponse() {
    }

    public CallReportResponse(Long id, LocalDate calledAt, LocalDate arrivedAt, CallType type, Long branchId,
            String branchName,
            String createdBy, LocalDateTime createdAt, Map<String, Integer> entries, Map<String, String> remarks,
            String remark) {
        this.id = id;
        this.calledAt = calledAt;
        this.arrivedAt = arrivedAt;
        this.type = type;
        this.branchId = branchId;
        this.branchName = branchName;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.entries = entries;
        this.remarks = remarks;
        this.remark = remark;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getCalledAt() {
        return calledAt;
    }

    public void setCalledAt(LocalDate calledAt) {
        this.calledAt = calledAt;
    }

    public LocalDate getArrivedAt() {
        return arrivedAt;
    }

    public void setArrivedAt(LocalDate arrivedAt) {
        this.arrivedAt = arrivedAt;
    }

    public CallType getType() {
        return type;
    }

    public void setType(CallType type) {
        this.type = type;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Map<String, Integer> getEntries() {
        return entries;
    }

    public void setEntries(Map<String, Integer> entries) {
        this.entries = entries;
    }

    public Map<String, String> getRemarks() {
        return remarks;
    }

    public void setRemarks(Map<String, String> remarks) {
        this.remarks = remarks;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
