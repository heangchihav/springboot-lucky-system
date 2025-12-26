package com.example.callservice.repository;

import com.example.callservice.entity.CallReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CallReportRepository extends JpaRepository<CallReport, Long> {

    List<CallReport> findByReportDate(LocalDate reportDate);
}
