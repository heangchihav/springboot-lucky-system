package com.example.marketingservice.dto.competitor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.Map;

public class MarketingCompetitorAssignmentRequest {

    @NotNull(message = "Area ID is required")
    private Long areaId;

    private Long subAreaId;

    @NotNull(message = "Competitor profiles are required")
    private Map<Long, CompetitorProfileRequest> competitorProfiles;

    public MarketingCompetitorAssignmentRequest() {
    }

    public MarketingCompetitorAssignmentRequest(
            Long areaId, 
            Long subAreaId,
            Map<Long, CompetitorProfileRequest> competitorProfiles) {
        this.areaId = areaId;
        this.subAreaId = subAreaId;
        this.competitorProfiles = competitorProfiles;
    }

    // Getters and setters

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    public Long getSubAreaId() {
        return subAreaId;
    }

    public void setSubAreaId(Long subAreaId) {
        this.subAreaId = subAreaId;
    }

    public Map<Long, CompetitorProfileRequest> getCompetitorProfiles() {
        return competitorProfiles;
    }

    public void setCompetitorProfiles(Map<Long, CompetitorProfileRequest> competitorProfiles) {
        this.competitorProfiles = competitorProfiles;
    }

    public static class CompetitorProfileRequest {
        private CompetitorPriceRangeRequest priceRange;
        private java.util.List<String> strengths;
        private java.util.List<String> weaknesses;
        private String remarks;
        @PositiveOrZero(message = "Branch count must be positive or zero")
        private Integer branchCount;

        public CompetitorProfileRequest() {
        }

        public CompetitorProfileRequest(
                CompetitorPriceRangeRequest priceRange,
                java.util.List<String> strengths,
                java.util.List<String> weaknesses,
                String remarks,
                Integer branchCount) {
            this.priceRange = priceRange;
            this.strengths = strengths;
            this.weaknesses = weaknesses;
            this.remarks = remarks;
            this.branchCount = branchCount;
        }

        // Getters and setters
        public CompetitorPriceRangeRequest getPriceRange() {
            return priceRange;
        }

        public void setPriceRange(CompetitorPriceRangeRequest priceRange) {
            this.priceRange = priceRange;
        }

        public java.util.List<String> getStrengths() {
            return strengths;
        }

        public void setStrengths(java.util.List<String> strengths) {
            this.strengths = strengths;
        }

        public java.util.List<String> getWeaknesses() {
            return weaknesses;
        }

        public void setWeaknesses(java.util.List<String> weaknesses) {
            this.weaknesses = weaknesses;
        }

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }

        public Integer getBranchCount() {
            return branchCount;
        }

        public void setBranchCount(Integer branchCount) {
            this.branchCount = branchCount;
        }
    }

    public static class CompetitorPriceRangeRequest {

        @NotNull(message = "Lowest price is required")
        @PositiveOrZero(message = "Lowest price must be positive or zero")
        private Long lowestPrice;

        @NotNull(message = "Highest price is required")
        @PositiveOrZero(message = "Highest price must be positive or zero")
        private Long highestPrice;

        public CompetitorPriceRangeRequest() {
        }

        public CompetitorPriceRangeRequest(Long lowestPrice, Long highestPrice) {
            this.lowestPrice = lowestPrice;
            this.highestPrice = highestPrice;
        }

        public Long getLowestPrice() {
            return lowestPrice;
        }

        public void setLowestPrice(Long lowestPrice) {
            this.lowestPrice = lowestPrice;
        }

        public Long getHighestPrice() {
            return highestPrice;
        }

        public void setHighestPrice(Long highestPrice) {
            this.highestPrice = highestPrice;
        }
    }
}
