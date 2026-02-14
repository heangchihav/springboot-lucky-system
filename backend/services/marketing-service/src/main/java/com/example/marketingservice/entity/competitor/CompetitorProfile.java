package com.example.marketingservice.entity.competitor;

import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.Arrays;
import java.util.List;

@Embeddable
public class CompetitorProfile {

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "lowestPrice", column = @Column(name = "price_lowest")),
        @AttributeOverride(name = "highestPrice", column = @Column(name = "price_highest"))
    })
    private CompetitorPriceRange priceRange;

    @Column(name = "strengths", length = 1000)
    private String strengths;

    @Column(name = "weaknesses", length = 1000)
    private String weaknesses;

    @Column(length = 2000)
    private String remarks;

    @Column(name = "branch_count", nullable = false)
    @PositiveOrZero(message = "Branch count must be positive or zero")
    private Integer branchCount;

    public CompetitorProfile() {
    }

    public CompetitorProfile(
            CompetitorPriceRange priceRange,
            List<String> strengths,
            List<String> weaknesses,
            String remarks,
            Integer branchCount) {
        this.priceRange = priceRange;
        this.strengths = strengths != null ? String.join(",", strengths) : null;
        this.weaknesses = weaknesses != null ? String.join(",", weaknesses) : null;
        this.remarks = remarks;
        this.branchCount = branchCount;
    }

    // Getters and setters

    public CompetitorPriceRange getPriceRange() {
        return priceRange;
    }

    public void setPriceRange(CompetitorPriceRange priceRange) {
        this.priceRange = priceRange;
    }

    public List<String> getStrengths() {
        return strengths != null && !strengths.isEmpty() 
            ? Arrays.asList(strengths.split(","))
            : List.of();
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths != null && !strengths.isEmpty() 
            ? String.join(",", strengths) 
            : null;
    }

    public List<String> getWeaknesses() {
        return weaknesses != null && !weaknesses.isEmpty() 
            ? Arrays.asList(weaknesses.split(","))
            : List.of();
    }

    public void setWeaknesses(List<String> weaknesses) {
        this.weaknesses = weaknesses != null && !weaknesses.isEmpty() 
            ? String.join(",", weaknesses) 
            : null;
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
