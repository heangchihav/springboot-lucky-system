package com.example.marketingservice.entity.dailyreport;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "marketing_daily_report_items")
public class DailyReportItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_report_id", nullable = false)
    private DailyReport dailyReport;

    @Column(name = "item_name", nullable = false, length = 1000)
    private String itemName;

    @ElementCollection
    @CollectionTable(name = "marketing_daily_report_item_values", joinColumns = @JoinColumn(name = "daily_report_item_id"))
    @Column(name = "value", length = 2000)
    private List<String> values;

    // Constructors
    public DailyReportItem() {
    }

    public DailyReportItem(String itemName, List<String> values) {
        this.itemName = itemName;
        this.values = values;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DailyReport getDailyReport() {
        return dailyReport;
    }

    public void setDailyReport(DailyReport dailyReport) {
        this.dailyReport = dailyReport;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public List<String> getValues() {
        return values;
    }

    public void setValues(List<String> values) {
        this.values = values;
    }
}
