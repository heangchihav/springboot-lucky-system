package com.example.marketingservice.dto.goods;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class MarketingGoodsShipmentUpdateRequest {

    @NotNull
    private LocalDate sendDate;

    @Min(0)
    private Integer totalGoods;

    public LocalDate getSendDate() {
        return sendDate;
    }

    public void setSendDate(LocalDate sendDate) {
        this.sendDate = sendDate;
    }

    public Integer getTotalGoods() {
        return totalGoods;
    }

    public void setTotalGoods(Integer totalGoods) {
        this.totalGoods = totalGoods;
    }
}
