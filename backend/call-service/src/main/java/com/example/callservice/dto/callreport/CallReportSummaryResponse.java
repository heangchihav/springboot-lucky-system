package com.example.callservice.dto.callreport;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

public class CallReportSummaryResponse {

    private LocalDate calledAt;
    private LocalDate arrivedAt;
    private Long branchId;
    private String branchName;
    private Map<String, Long> statusTotals = new HashMap<>();
    private boolean sameDayArrival;

    public CallReportSummaryResponse() {
    }

    public CallReportSummaryResponse(LocalDate calledAt, LocalDate arrivedAt, Long branchId, String branchName,
            Map<String, Long> statusTotals) {
        this.calledAt = calledAt;
        this.arrivedAt = arrivedAt;
        this.branchId = branchId;
        this.branchName = branchName;
        this.statusTotals = statusTotals;
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

    public boolean isSameDayArrival() {
        return sameDayArrival;
    }

    public void setSameDayArrival(boolean sameDayArrival) {
        this.sameDayArrival = sameDayArrival;
    }
}
