package com.example.marketingservice.dto.schedule;

import java.time.LocalDate;

public class WeeklyScheduleDayResponse {

    private Long id;
    private Integer dayNumber;
    private String dayName;
    private LocalDate date;
    private Boolean isDayOff;
    private String remark;
    private String morningSchedule;
    private String afternoonSchedule;
    private Boolean inMonth;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
