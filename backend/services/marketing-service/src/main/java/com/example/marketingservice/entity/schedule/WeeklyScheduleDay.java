package com.example.marketingservice.entity.schedule;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Entity
@Table(name = "marketing_weekly_schedule_days", indexes = {
        @Index(name = "idx_schedule_day_schedule", columnList = "weekly_schedule_id"),
        @Index(name = "idx_schedule_day_date", columnList = "schedule_date")
})
public class WeeklyScheduleDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weekly_schedule_id", nullable = false)
    private WeeklySchedule weeklySchedule;

    @NotNull
    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @NotNull
    @Size(max = 20)
    @Column(name = "day_name", nullable = false, length = 20)
    private String dayName;

    @NotNull
    @Column(name = "schedule_date", nullable = false)
    private LocalDate date;

    @NotNull
    @Column(name = "is_day_off", nullable = false)
    private Boolean isDayOff = false;

    @Size(max = 500)
    @Column(name = "remark", length = 500)
    private String remark;

    @Size(max = 500)
    @Column(name = "morning_schedule", length = 500)
    private String morningSchedule;

    @Size(max = 500)
    @Column(name = "afternoon_schedule", length = 500)
    private String afternoonSchedule;

    @NotNull
    @Column(name = "in_month", nullable = false)
    private Boolean inMonth = false;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public WeeklySchedule getWeeklySchedule() {
        return weeklySchedule;
    }

    public void setWeeklySchedule(WeeklySchedule weeklySchedule) {
        this.weeklySchedule = weeklySchedule;
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
