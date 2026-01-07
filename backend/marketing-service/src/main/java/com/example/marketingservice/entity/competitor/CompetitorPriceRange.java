package com.example.marketingservice.entity.competitor;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;

import java.util.Objects;

@Embeddable
public class CompetitorPriceRange {

    @NotNull
    @Column(name = "lowest_price")
    private Long lowestPrice;

    @NotNull
    @Column(name = "highest_price")
    private Long highestPrice;

    public CompetitorPriceRange() {
    }

    public CompetitorPriceRange(Long lowestPrice, Long highestPrice) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CompetitorPriceRange that = (CompetitorPriceRange) o;
        return Objects.equals(lowestPrice, that.lowestPrice) && Objects.equals(highestPrice, that.highestPrice);
    }

    @Override
    public int hashCode() {
        return Objects.hash(lowestPrice, highestPrice);
    }

    @Override
    public String toString() {
        return "CompetitorPriceRange{" +
                "lowestPrice=" + lowestPrice +
                ", highestPrice=" + highestPrice +
                '}';
    }
}
