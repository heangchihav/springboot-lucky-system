package com.example.marketingservice.dto.goods;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class GoodsDashboardStatsResponse {

    private List<StatusMetric> statusMetrics;
    private List<HierarchyTotal> hierarchyTotals;
    private List<DailyTrend> dailyTrends;
    private List<WeeklyTrend> weeklyTrends;
    private List<MonthlyTrend> monthlyTrends;
    private SummaryStats summaryStats;

    public GoodsDashboardStatsResponse() {
    }

    public GoodsDashboardStatsResponse(List<StatusMetric> statusMetrics,
            List<HierarchyTotal> hierarchyTotals,
            List<DailyTrend> dailyTrends,
            List<WeeklyTrend> weeklyTrends,
            List<MonthlyTrend> monthlyTrends,
            SummaryStats summaryStats) {
        this.statusMetrics = statusMetrics;
        this.hierarchyTotals = hierarchyTotals;
        this.dailyTrends = dailyTrends;
        this.weeklyTrends = weeklyTrends;
        this.monthlyTrends = monthlyTrends;
        this.summaryStats = summaryStats;
    }

    public List<StatusMetric> getStatusMetrics() {
        return statusMetrics;
    }

    public void setStatusMetrics(List<StatusMetric> statusMetrics) {
        this.statusMetrics = statusMetrics;
    }

    public List<HierarchyTotal> getHierarchyTotals() {
        return hierarchyTotals;
    }

    public void setHierarchyTotals(List<HierarchyTotal> hierarchyTotals) {
        this.hierarchyTotals = hierarchyTotals;
    }

    public List<DailyTrend> getDailyTrends() {
        return dailyTrends;
    }

    public void setDailyTrends(List<DailyTrend> dailyTrends) {
        this.dailyTrends = dailyTrends;
    }

    public List<WeeklyTrend> getWeeklyTrends() {
        return weeklyTrends;
    }

    public void setWeeklyTrends(List<WeeklyTrend> weeklyTrends) {
        this.weeklyTrends = weeklyTrends;
    }

    public List<MonthlyTrend> getMonthlyTrends() {
        return monthlyTrends;
    }

    public void setMonthlyTrends(List<MonthlyTrend> monthlyTrends) {
        this.monthlyTrends = monthlyTrends;
    }

    public SummaryStats getSummaryStats() {
        return summaryStats;
    }

    public void setSummaryStats(SummaryStats summaryStats) {
        this.summaryStats = summaryStats;
    }

    public static class StatusMetric {
        private String metric;
        private int shipping;
        private int arrived;
        private int completed;
        private int total;

        public StatusMetric() {
        }

        public StatusMetric(String metric, int shipping, int arrived, int completed, int total) {
            this.metric = metric;
            this.shipping = shipping;
            this.arrived = arrived;
            this.completed = completed;
            this.total = total;
        }

        public String getMetric() {
            return metric;
        }

        public void setMetric(String metric) {
            this.metric = metric;
        }

        public int getShipping() {
            return shipping;
        }

        public void setShipping(int shipping) {
            this.shipping = shipping;
        }

        public int getArrived() {
            return arrived;
        }

        public void setArrived(int arrived) {
            this.arrived = arrived;
        }

        public int getCompleted() {
            return completed;
        }

        public void setCompleted(int completed) {
            this.completed = completed;
        }

        public int getTotal() {
            return total;
        }

        public void setTotal(int total) {
            this.total = total;
        }
    }

    public static class HierarchyTotal {
        private String key;
        private String label;
        private int total;
        private String type; // area, branch, subArea, member
        private Long id;
        private boolean highlight;

        public HierarchyTotal() {
        }

        public HierarchyTotal(String key, String label, int total, String type, Long id, boolean highlight) {
            this.key = key;
            this.label = label;
            this.total = total;
            this.type = type;
            this.id = id;
            this.highlight = highlight;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public int getTotal() {
            return total;
        }

        public void setTotal(int total) {
            this.total = total;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public boolean isHighlight() {
            return highlight;
        }

        public void setHighlight(boolean highlight) {
            this.highlight = highlight;
        }
    }

    public static class DailyTrend {
        private LocalDate date;
        private int totalGoods;

        public DailyTrend() {
        }

        public DailyTrend(LocalDate date, int totalGoods) {
            this.date = date;
            this.totalGoods = totalGoods;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public int getTotalGoods() {
            return totalGoods;
        }

        public void setTotalGoods(int totalGoods) {
            this.totalGoods = totalGoods;
        }
    }

    public static class WeeklyTrend {
        private int week;
        private int year;
        private String label;
        private int totalGoods;

        public WeeklyTrend() {
        }

        public WeeklyTrend(int week, int year, String label, int totalGoods) {
            this.week = week;
            this.year = year;
            this.label = label;
            this.totalGoods = totalGoods;
        }

        public int getWeek() {
            return week;
        }

        public void setWeek(int week) {
            this.week = week;
        }

        public int getYear() {
            return year;
        }

        public void setYear(int year) {
            this.year = year;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public int getTotalGoods() {
            return totalGoods;
        }

        public void setTotalGoods(int totalGoods) {
            this.totalGoods = totalGoods;
        }
    }

    public static class MonthlyTrend {
        private int month;
        private int year;
        private String label;
        private int totalGoods;

        public MonthlyTrend() {
        }

        public MonthlyTrend(int month, int year, String label, int totalGoods) {
            this.month = month;
            this.year = year;
            this.label = label;
            this.totalGoods = totalGoods;
        }

        public int getMonth() {
            return month;
        }

        public void setMonth(int month) {
            this.month = month;
        }

        public int getYear() {
            return year;
        }

        public void setYear(int year) {
            this.year = year;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public int getTotalGoods() {
            return totalGoods;
        }

        public void setTotalGoods(int totalGoods) {
            this.totalGoods = totalGoods;
        }
    }

    public static class SummaryStats {
        private int totalGoods;
        private int totalMembers;
        private int totalBranches;
        private int totalAreas;
        private int totalSubAreas;

        public SummaryStats() {
        }

        public SummaryStats(int totalGoods, int totalMembers, int totalBranches, int totalAreas, int totalSubAreas) {
            this.totalGoods = totalGoods;
            this.totalMembers = totalMembers;
            this.totalBranches = totalBranches;
            this.totalAreas = totalAreas;
            this.totalSubAreas = totalSubAreas;
        }

        public int getTotalGoods() {
            return totalGoods;
        }

        public void setTotalGoods(int totalGoods) {
            this.totalGoods = totalGoods;
        }

        public int getTotalMembers() {
            return totalMembers;
        }

        public void setTotalMembers(int totalMembers) {
            this.totalMembers = totalMembers;
        }

        public int getTotalBranches() {
            return totalBranches;
        }

        public void setTotalBranches(int totalBranches) {
            this.totalBranches = totalBranches;
        }

        public int getTotalAreas() {
            return totalAreas;
        }

        public void setTotalAreas(int totalAreas) {
            this.totalAreas = totalAreas;
        }

        public int getTotalSubAreas() {
            return totalSubAreas;
        }

        public void setTotalSubAreas(int totalSubAreas) {
            this.totalSubAreas = totalSubAreas;
        }
    }
}
