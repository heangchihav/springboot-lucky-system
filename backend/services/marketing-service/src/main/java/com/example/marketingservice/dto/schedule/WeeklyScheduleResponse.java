package com.example.marketingservice.dto.schedule;

import java.time.LocalDateTime;
import java.util.List;

public class WeeklyScheduleResponse {

    private Long id;
    private Long userId;
    private String createdBy;
    private String createdByFullName;
    private String createdByPhone;
    private Integer year;
    private Integer month;
    private Integer weekNumber;
    private List<WeeklyScheduleDayResponse> days;
    private BranchInfo branch;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdByUserId;

    public static class BranchInfo {
        private Long id;
        private String name;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedByFullName() {
        return createdByFullName;
    }

    public void setCreatedByFullName(String createdByFullName) {
        this.createdByFullName = createdByFullName;
    }

    public String getCreatedByPhone() {
        return createdByPhone;
    }

    public void setCreatedByPhone(String createdByPhone) {
        this.createdByPhone = createdByPhone;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getWeekNumber() {
        return weekNumber;
    }

    public void setWeekNumber(Integer weekNumber) {
        this.weekNumber = weekNumber;
    }

    public List<WeeklyScheduleDayResponse> getDays() {
        return days;
    }

    public void setDays(List<WeeklyScheduleDayResponse> days) {
        this.days = days;
    }

    public BranchInfo getBranch() {
        return branch;
    }

    public void setBranch(BranchInfo branch) {
        this.branch = branch;
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
}
