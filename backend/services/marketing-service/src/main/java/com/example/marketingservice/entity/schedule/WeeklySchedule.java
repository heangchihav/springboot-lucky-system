package com.example.marketingservice.entity.schedule;

import com.example.marketingservice.entity.branch.MarketingBranch;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "marketing_weekly_schedules", indexes = {
        @Index(name = "idx_weekly_schedule_user", columnList = "user_id"),
        @Index(name = "idx_weekly_schedule_branch", columnList = "branch_id"),
        @Index(name = "idx_weekly_schedule_month", columnList = "month"),
        @Index(name = "idx_weekly_schedule_year", columnList = "year"),
        @Index(name = "idx_weekly_schedule_user_month", columnList = "user_id, month, year")
})
public class WeeklySchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotNull
    @Column(name = "year", nullable = false)
    private Integer year;

    @NotNull
    @Column(name = "month", nullable = false)
    private Integer month;

    @NotNull
    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    @OneToMany(mappedBy = "weeklySchedule", cascade = {}, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WeeklyScheduleDay> days = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private MarketingBranch branch;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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

    public List<WeeklyScheduleDay> getDays() {
        return days;
    }

    public void setDays(List<WeeklyScheduleDay> days) {
        this.days = days;
    }

    public MarketingBranch getBranch() {
        return branch;
    }

    public void setBranch(MarketingBranch branch) {
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

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
