package com.example.callservice.repository.callreport;

import java.time.LocalDate;

public interface CallReportSummaryProjection {

    LocalDate getCalledAt();

    LocalDate getArrivedAt();

    Long getBranchId();

    String getBranchName();

    String getStatusKey();

    Long getTotal();
}
