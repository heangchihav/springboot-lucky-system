package com.example.marketingservice.repository.dailyreport;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.marketingservice.entity.dailyreport.DailyReport;

import java.util.List;
import java.util.Optional;

@Repository
public interface DailyReportRepository extends JpaRepository<DailyReport, Long> {

    Optional<DailyReport> findByReportId(String reportId);

    List<DailyReport> findByReportDateOrderByReportDateDesc(String reportDate);

    List<DailyReport> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    @Query("SELECT dr FROM DailyReport dr WHERE dr.reportDate BETWEEN :startDate AND :endDate ORDER BY dr.reportDate DESC")
    List<DailyReport> findByDateRange(@Param("startDate") String startDate, @Param("endDate") String endDate);

    @Query("SELECT dr FROM DailyReport dr WHERE dr.createdBy = :createdBy AND dr.reportDate BETWEEN :startDate AND :endDate ORDER BY dr.reportDate DESC")
    List<DailyReport> findByCreatedByAndDateRange(@Param("createdBy") String createdBy,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate);

    boolean existsByReportId(String reportId);

    @Query("SELECT COUNT(dr) FROM DailyReport dr WHERE dr.reportDate = :reportDate")
    long countByReportDate(@Param("reportDate") String reportDate);

    List<DailyReport> findAllByOrderByCreatedAtDesc();
}
