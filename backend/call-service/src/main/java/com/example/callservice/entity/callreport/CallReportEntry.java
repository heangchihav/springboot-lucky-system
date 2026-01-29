package com.example.callservice.entity.callreport;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "call_report_entries")
public class CallReportEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private CallReport report;

    @Column(name = "status_key", nullable = false)
    private String statusKey;

    @Column(name = "status_value", nullable = false)
    private Integer statusValue;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public CallReportEntry() {
    }

    public CallReportEntry(CallReport report, String statusKey, Integer statusValue, String remark) {
        this.report = report;
        this.statusKey = statusKey;
        this.statusValue = statusValue;
        this.remark = remark;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CallReport getReport() {
        return report;
    }

    public void setReport(CallReport report) {
        this.report = report;
    }

    public String getStatusKey() {
        return statusKey;
    }

    public void setStatusKey(String statusKey) {
        this.statusKey = statusKey;
    }

    public Integer getStatusValue() {
        return statusValue;
    }

    public void setStatusValue(Integer statusValue) {
        this.statusValue = statusValue;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
