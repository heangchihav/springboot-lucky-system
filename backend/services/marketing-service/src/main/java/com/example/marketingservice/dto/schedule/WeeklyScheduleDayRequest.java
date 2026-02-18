package com.example.marketingservice.dto.schedule;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class WeeklyScheduleDayRequest {

    @NotNull
    private Integer dayNumber;

    @NotNull
    @Size(max = 20)
    private String dayName;

    @NotNull
    private LocalDate date;

    @NotNull
    private Boolean isDayOff = false;

    @Size(max = 500)
    private String remark;

    @Size(max = 500)
    private String morningSchedule;

    @Size(max = 500)
    private String afternoonSchedule;

    @NotNull
    private Boolean inMonth = false;

    public Integer getDayNumber() {
        return dayNumber;
    }

    public void setDayNumber(Integer dayNumber) {
        this.dayNumber = dayNumber;
    }

    public String getDayName() {
        return dayName;
    }

    public void setDayName(String dayName) {
        this.dayName = dayName;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Boolean getIsDayOff() {
        return isDayOff;
    }

    public void setIsDayOff(Boolean isDayOff) {
        this.isDayOff = isDayOff;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getMorningSchedule() {
        return morningSchedule;
    }

    public void setMorningSchedule(String morningSchedule) {
        this.morningSchedule = morningSchedule;
    }

    public String getAfternoonSchedule() {
        return afternoonSchedule;
    }

    public void setAfternoonSchedule(String afternoonSchedule) {
        this.afternoonSchedule = afternoonSchedule;
    }

    public Boolean getInMonth() {
        return inMonth;
    }

    public void setInMonth(Boolean inMonth) {
        this.inMonth = inMonth;
    }
}
