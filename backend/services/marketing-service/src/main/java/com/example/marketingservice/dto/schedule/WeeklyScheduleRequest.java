package com.example.marketingservice.dto.schedule;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public class WeeklyScheduleRequest {

    @NotNull
    private Long userId;

    @NotNull
    private Integer year;

    @NotNull
    private Integer month;

    @NotNull
    private Integer weekNumber;

    private Long branchId;

    private List<WeeklyScheduleDayRequest> days;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public List<WeeklyScheduleDayRequest> getDays() {
        return days;
    }

    public void setDays(List<WeeklyScheduleDayRequest> days) {
        this.days = days;
    }
}
