package com.example.callservice.dto.callreport;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

public class CallReportSummaryResponse {

    private LocalDate reportDate;
    private Long branchId;
    private String branchName;
    private Map<String, Long> statusTotals = new HashMap<>();

    public CallReportSummaryResponse() {
    }

    public CallReportSummaryResponse(LocalDate reportDate, Long branchId, String branchName, Map<String, Long> statusTotals) {
        this.reportDate = reportDate;
        this.branchId = branchId;
        this.branchName = branchName;
        this.statusTotals = statusTotals;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
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

    public Map<String, Long> getStatusTotals() {
        return statusTotals;
    }

    public void setStatusTotals(Map<String, Long> statusTotals) {
        this.statusTotals = statusTotals;
    }
}
