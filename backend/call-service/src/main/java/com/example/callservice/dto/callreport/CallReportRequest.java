package com.example.callservice.dto.callreport;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Map;

public class CallReportRequest {

    @NotNull
    private LocalDate reportDate;

    @NotNull
    @Size(min = 1)
    private Map<String, Integer> entries;

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public Map<String, Integer> getEntries() {
        return entries;
    }

    public void setEntries(Map<String, Integer> entries) {
        this.entries = entries;
    }
}
