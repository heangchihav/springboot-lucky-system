package com.example.callservice.repository.callreport;

import com.example.callservice.entity.callreport.CallReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CallReportRepository extends JpaRepository<CallReport, Long> {

  List<CallReport> findByCalledAt(LocalDate calledAt);

  List<CallReport> findByCreatedByOrderByCreatedAtDesc(String createdBy);

  List<CallReport> findByBranch_IdInOrderByCreatedAtDesc(List<Long> branchIds);

  @Query(value = """
          SELECT cr.called_at as calledAt,
                 cr.arrived_at as arrivedAt,
                 cr.branch_id as branchId,
                 COALESCE(b.name, 'Unassigned') as branchName,
                 cre.status_key as statusKey,
                 SUM(cre.status_value) as total
          FROM call_reports cr
          JOIN call_report_entries cre ON cr.id = cre.report_id
          LEFT JOIN branches b ON cr.branch_id = b.id
          WHERE (:filterByStartDate = FALSE OR cr.called_at >= CAST(:startDate AS DATE))
            AND (:filterByEndDate = FALSE OR cr.called_at <= CAST(:endDate AS DATE))
            AND (:filterByBranch = FALSE OR cr.branch_id IN (:branchIds))
            AND (:filterByArea = FALSE OR b.area_id IN (:areaIds))
            AND (:filterBySubarea = FALSE OR b.subarea_id IN (:subareaIds))
            AND (:filterByStatus = FALSE OR cre.status_key IN (:statusKeys))
          GROUP BY cr.called_at, cr.arrived_at, cr.branch_id, b.name, cre.status_key
          ORDER BY cr.called_at ASC
      """, nativeQuery = true)
  List<CallReportSummaryProjection> summarizeReportsWithFilters(
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate,
      @Param("filterByStartDate") boolean filterByStartDate,
      @Param("filterByEndDate") boolean filterByEndDate,
      @Param("filterByBranch") boolean filterByBranch,
      @Param("branchIds") List<Long> branchIds,
      @Param("filterByArea") boolean filterByArea,
      @Param("areaIds") List<Long> areaIds,
      @Param("filterBySubarea") boolean filterBySubarea,
      @Param("subareaIds") List<Long> subareaIds,
      @Param("filterByStatus") boolean filterByStatus,
      @Param("statusKeys") List<String> statusKeys);

  @Query(value = """
          SELECT cr.called_at as calledAt,
                 cr.arrived_at as arrivedAt,
                 cr.branch_id as branchId,
                 COALESCE(b.name, 'Unassigned') as branchName,
                 cre.status_key as statusKey,
                 SUM(cre.status_value) as total
          FROM call_reports cr
          JOIN call_report_entries cre ON cr.id = cre.report_id
          LEFT JOIN branches b ON cr.branch_id = b.id
          GROUP BY cr.called_at, cr.arrived_at, cr.branch_id, b.name, cre.status_key
          ORDER BY cr.called_at ASC
      """, nativeQuery = true)
  List<CallReportSummaryProjection> summarizeReports();
}
