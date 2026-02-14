package com.example.marketingservice.dto.member;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class VipMemberDashboardResponse {

    private Map<String, Long> areaCounts;
    private Map<String, Long> subAreaCounts;
    private Map<String, Long> branchCounts;
    private List<DailyCount> dailyCounts;
    private List<WeeklyCount> weeklyCounts;
    private List<MonthlyCount> monthlyCounts;
    private LocalDate earliestDate;
    private LocalDate latestDate;
    private long totalMembers;
    private long activeMembers;

    public VipMemberDashboardResponse() {
    }

    public VipMemberDashboardResponse(
            Map<String, Long> areaCounts,
            Map<String, Long> subAreaCounts,
            Map<String, Long> branchCounts,
            List<DailyCount> dailyCounts,
            List<WeeklyCount> weeklyCounts,
            List<MonthlyCount> monthlyCounts,
            LocalDate earliestDate,
            LocalDate latestDate,
            long totalMembers,
            long activeMembers) {
        this.areaCounts = areaCounts;
        this.subAreaCounts = subAreaCounts;
        this.branchCounts = branchCounts;
        this.dailyCounts = dailyCounts;
        this.weeklyCounts = weeklyCounts;
        this.monthlyCounts = monthlyCounts;
        this.earliestDate = earliestDate;
        this.latestDate = latestDate;
        this.totalMembers = totalMembers;
        this.activeMembers = activeMembers;
    }

    public Map<String, Long> getAreaCounts() {
        return areaCounts;
    }

    public void setAreaCounts(Map<String, Long> areaCounts) {
        this.areaCounts = areaCounts;
    }

    public Map<String, Long> getSubAreaCounts() {
        return subAreaCounts;
    }

    public void setSubAreaCounts(Map<String, Long> subAreaCounts) {
        this.subAreaCounts = subAreaCounts;
    }

    public Map<String, Long> getBranchCounts() {
        return branchCounts;
    }

    public void setBranchCounts(Map<String, Long> branchCounts) {
        this.branchCounts = branchCounts;
    }

    public List<DailyCount> getDailyCounts() {
        return dailyCounts;
    }

    public void setDailyCounts(List<DailyCount> dailyCounts) {
        this.dailyCounts = dailyCounts;
    }

    public List<WeeklyCount> getWeeklyCounts() {
        return weeklyCounts;
    }

    public void setWeeklyCounts(List<WeeklyCount> weeklyCounts) {
        this.weeklyCounts = weeklyCounts;
    }

    public List<MonthlyCount> getMonthlyCounts() {
        return monthlyCounts;
    }

    public void setMonthlyCounts(List<MonthlyCount> monthlyCounts) {
        this.monthlyCounts = monthlyCounts;
    }

    public LocalDate getEarliestDate() {
        return earliestDate;
    }

    public void setEarliestDate(LocalDate earliestDate) {
        this.earliestDate = earliestDate;
    }

    public LocalDate getLatestDate() {
        return latestDate;
    }

    public void setLatestDate(LocalDate latestDate) {
        this.latestDate = latestDate;
    }

    public long getTotalMembers() {
        return totalMembers;
    }

    public void setTotalMembers(long totalMembers) {
        this.totalMembers = totalMembers;
    }

    public long getActiveMembers() {
        return activeMembers;
    }

    public void setActiveMembers(long activeMembers) {
        this.activeMembers = activeMembers;
    }

    public static class DailyCount {
        private String date;
        private long count;

        public DailyCount() {
        }

        public DailyCount(String date, long count) {
            this.date = date;
            this.count = count;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }

    public static class WeeklyCount {
        private String week;
        private String yearWeek;
        private long count;

        public WeeklyCount() {
        }

        public WeeklyCount(String week, String yearWeek, long count) {
            this.week = week;
            this.yearWeek = yearWeek;
            this.count = count;
        }

        public String getWeek() {
            return week;
        }

        public void setWeek(String week) {
            this.week = week;
        }

        public String getYearWeek() {
            return yearWeek;
        }

        public void setYearWeek(String yearWeek) {
            this.yearWeek = yearWeek;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }

    public static class MonthlyCount {
        private String month;
        private String yearMonth;
        private long count;

        public MonthlyCount() {
        }

        public MonthlyCount(String month, String yearMonth, long count) {
            this.month = month;
            this.yearMonth = yearMonth;
            this.count = count;
        }

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public String getYearMonth() {
            return yearMonth;
        }

        public void setYearMonth(String yearMonth) {
            this.yearMonth = yearMonth;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }
}
