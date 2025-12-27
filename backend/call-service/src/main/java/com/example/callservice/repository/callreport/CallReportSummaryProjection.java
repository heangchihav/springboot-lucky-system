package com.example.callservice.repository.callreport;

import java.time.LocalDate;

public interface CallReportSummaryProjection {

    LocalDate getReportDate();

    Long getBranchId();

    String getBranchName();

    String getStatusKey();

    Long getTotal();
}
