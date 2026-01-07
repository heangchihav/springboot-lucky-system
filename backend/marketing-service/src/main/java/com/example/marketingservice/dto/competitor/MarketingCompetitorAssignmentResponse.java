package com.example.marketingservice.dto.competitor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MarketingCompetitorAssignmentResponse {

    private Long id;

    private Long areaId;
    private String areaName;

    private Long subAreaId;
    private String subAreaName;

    private Map<Long, CompetitorProfileResponse> competitorProfiles;

    private String createdAt;
    private String updatedAt;
    private Long createdBy;

    public MarketingCompetitorAssignmentResponse() {
    }

    public MarketingCompetitorAssignmentResponse(
            Long id,
            Long areaId,
            String areaName,
            Long subAreaId,
            String subAreaName,
            Map<Long, CompetitorProfileResponse> competitorProfiles,
            String createdAt,
            String updatedAt,
            Long createdBy) {
        this.id = id;
        this.areaId = areaId;
        this.areaName = areaName;
        this.subAreaId = subAreaId;
        this.subAreaName = subAreaName;
        this.competitorProfiles = competitorProfiles;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
    }

    public static MarketingCompetitorAssignmentResponse from(
            com.example.marketingservice.entity.competitor.MarketingCompetitorAssignment entity) {
        Map<Long, CompetitorProfileResponse> competitorProfiles = new HashMap<>();
        if (entity.getCompetitorProfiles() != null) {
            entity.getCompetitorProfiles().forEach((competitorId, profile) -> {
                CompetitorPriceRangeResponse priceRange = null;
                if (profile.getPriceRange() != null) {
                    priceRange = new CompetitorPriceRangeResponse(
                            profile.getPriceRange().getLowestPrice(),
                            profile.getPriceRange().getHighestPrice());
                }

                competitorProfiles.put(competitorId, new CompetitorProfileResponse(
                        priceRange,
                        profile.getStrengths(),
                        profile.getWeaknesses(),
                        profile.getRemarks(),
                        profile.getBranchCount()));
            });
        }

        return new MarketingCompetitorAssignmentResponse(
                entity.getId(),
                entity.getArea() != null ? entity.getArea().getId() : null,
                entity.getArea() != null ? entity.getArea().getName() : null,
                entity.getSubArea() != null ? entity.getSubArea().getId() : null,
                entity.getSubArea() != null ? entity.getSubArea().getName() : null,
                competitorProfiles,
                entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null,
                entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null,
                entity.getCreatedBy());
    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getAreaName() {
        return areaName;
    }

    public void setAreaName(String areaName) {
        this.areaName = areaName;
    }

    public String getSubAreaName() {
        return subAreaName;
    }

    public void setSubAreaName(String subAreaName) {
        this.subAreaName = subAreaName;
    }

    public Map<Long, CompetitorProfileResponse> getCompetitorProfiles() {
        return competitorProfiles;
    }

    public void setCompetitorProfiles(Map<Long, CompetitorProfileResponse> competitorProfiles) {
        this.competitorProfiles = competitorProfiles;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public static class CompetitorProfileResponse {
        private CompetitorPriceRangeResponse priceRange;
        private List<String> strengths;
        private List<String> weaknesses;
        private String remarks;
        private Integer branchCount;

        public CompetitorProfileResponse() {
        }

        public CompetitorProfileResponse(
                CompetitorPriceRangeResponse priceRange,
                List<String> strengths,
                List<String> weaknesses,
                String remarks,
                Integer branchCount) {
            this.priceRange = priceRange;
            this.strengths = strengths;
            this.weaknesses = weaknesses;
            this.remarks = remarks;
            this.branchCount = branchCount;
        }

        // Getters and setters
        public CompetitorPriceRangeResponse getPriceRange() {
            return priceRange;
        }

        public void setPriceRange(CompetitorPriceRangeResponse priceRange) {
            this.priceRange = priceRange;
        }

        public List<String> getStrengths() {
            return strengths;
        }

        public void setStrengths(List<String> strengths) {
            this.strengths = strengths;
        }

        public List<String> getWeaknesses() {
            return weaknesses;
        }

        public void setWeaknesses(List<String> weaknesses) {
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

    public static class CompetitorPriceRangeResponse {

        private Long lowestPrice;
        private Long highestPrice;

        public CompetitorPriceRangeResponse() {
        }

        public CompetitorPriceRangeResponse(Long lowestPrice, Long highestPrice) {
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
