package com.example.callservice.dto.callreport;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Map;

public class CallReportRequest {

    private LocalDate calledAt;

    private LocalDate arrivedAt;

    private Long branchId;

    @NotNull
    @Size(min = 1)
    private Map<String, Integer> entries;

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
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

    public Map<String, Integer> getEntries() {
        return entries;
    }

    public void setEntries(Map<String, Integer> entries) {
        this.entries = entries;
    }
}
