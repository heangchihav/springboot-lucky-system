package com.example.marketingservice.entity.dailyreport;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "marketing_daily_reports")
public class DailyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_id", nullable = false, unique = true, length = 50)
    private String reportId;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "report_date", nullable = false)
    private String reportDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "dailyReport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<DailyReportItem> items;

    // Constructors
    public DailyReport() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public DailyReport(String reportId, String createdBy, String reportDate, List<DailyReportItem> items) {
        this();
        this.reportId = reportId;
        this.createdBy = createdBy;
        this.reportDate = reportDate;
        this.items = items;
        if (items != null) {
            items.forEach(item -> item.setDailyReport(this));
        }
    }

    // JPA lifecycle callbacks
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReportId() {
        return reportId;
    }

    public void setReportId(String reportId) {
        this.reportId = reportId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getReportDate() {
        return reportDate;
    }

    public void setReportDate(String reportDate) {
        this.reportDate = reportDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<DailyReportItem> getItems() {
        return items;
    }

    public void setItems(List<DailyReportItem> items) {
        this.items = items;
        if (items != null) {
            items.forEach(item -> item.setDailyReport(this));
        }
    }
}
