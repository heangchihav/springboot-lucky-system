package com.example.callservice.repository.callreport;

import com.example.callservice.entity.callreport.CallReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CallReportRepository extends JpaRepository<CallReport, Long> {

    List<CallReport> findByReportDate(LocalDate reportDate);

    List<CallReport> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    List<CallReport> findByBranch_IdInOrderByCreatedAtDesc(List<Long> branchIds);

    @Query(value = """
        SELECT cr.report_date as reportDate,
               cr.branch_id as branchId,
               COALESCE(b.name, 'Unassigned') as branchName,
               cre.status_key as statusKey,
               SUM(cre.status_value) as total
        FROM call_reports cr
        JOIN call_report_entries cre ON cr.id = cre.report_id
        LEFT JOIN branches b ON cr.branch_id = b.id
        GROUP BY cr.report_date, cr.branch_id, b.name, cre.status_key
        ORDER BY cr.report_date ASC
    """, nativeQuery = true)
    List<CallReportSummaryProjection> summarizeReports();
}
