package com.example.callservice.entity.callreport;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.example.callservice.entity.branch.Branch;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "call_reports")
public class CallReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "called_at", nullable = false)
    private LocalDate calledAt;

    @Column(name = "arrived_at")
    private LocalDate arrivedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @NotBlank
    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CallReportEntry> entries = new ArrayList<>();

    public CallReport() {
    }

    public CallReport(LocalDate calledAt, Branch branch, String createdBy, List<CallReportEntry> entries) {
        this.calledAt = calledAt;
        this.branch = branch;
        this.createdBy = createdBy;
        this.entries = entries;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Helper method to get entries as Map for backward compatibility
    public Map<String, Integer> getEntriesAsMap() {
        Map<String, Integer> map = new HashMap<>();
        for (CallReportEntry entry : entries) {
            map.put(entry.getStatusKey(), entry.getStatusValue());
        }
        return map;
    }

    // Helper method to set entries from Map
    public void setEntriesFromMap(Map<String, Integer> entriesMap, Map<String, String> remarksMap) {
        // Remove existing entries that are not in the new map
        this.entries.removeIf(entry -> !entriesMap.containsKey(entry.getStatusKey()));

        // Update existing entries or add new ones
        for (Map.Entry<String, Integer> entry : entriesMap.entrySet()) {
            String statusKey = entry.getKey();
            Integer statusValue = entry.getValue();
            String remark = remarksMap != null ? remarksMap.get(statusKey) : null;

            // Find existing entry
            CallReportEntry existingEntry = this.entries.stream()
                    .filter(e -> e.getStatusKey().equals(statusKey))
                    .findFirst()
                    .orElse(null);

            if (existingEntry != null) {
                // Update existing entry
                existingEntry.setStatusValue(statusValue);
                existingEntry.setRemark(remark);
            } else {
                // Add new entry
                this.entries.add(new CallReportEntry(this, statusKey, statusValue, remark));
            }
        }
    }

    // Helper method to get remarks as Map
    public Map<String, String> getRemarksAsMap() {
        Map<String, String> map = new HashMap<>();
        for (CallReportEntry entry : entries) {
            if (entry.getRemark() != null) {
                map.put(entry.getStatusKey(), entry.getRemark());
            }
        }
        return map;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Branch getBranch() {
        return branch;
    }

    public void setBranch(Branch branch) {
        this.branch = branch;
    }

    public LocalDate getCalledAt() {
        return calledAt;
    }

    public void setCalledAt(LocalDate calledAt) {
        this.calledAt = calledAt;
    }

    public LocalDate getArrivedAt() {
        return arrivedAt;
    }

    public void setArrivedAt(LocalDate arrivedAt) {
        this.arrivedAt = arrivedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public List<CallReportEntry> getEntries() {
        return entries;
    }

    public void setEntries(List<CallReportEntry> entries) {
        this.entries = entries;
    }
}
