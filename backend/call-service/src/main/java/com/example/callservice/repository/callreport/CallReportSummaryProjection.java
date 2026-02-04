package com.example.callservice.repository.callreport;

import com.example.callservice.entity.callreport.CallType;
import java.time.LocalDate;

public interface CallReportSummaryProjection {

    LocalDate getCalledAt();

    LocalDate getArrivedAt();

    String getType(); // Changed from CallType to String to handle native SQL properly

    Long getBranchId();

    String getBranchName();

    String getStatusKey();

    Long getTotal();
}
