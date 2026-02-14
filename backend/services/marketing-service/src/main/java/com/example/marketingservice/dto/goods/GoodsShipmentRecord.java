package com.example.marketingservice.dto.goods;

import java.time.LocalDate;

public class GoodsShipmentRecord {
    private LocalDate sendDate;
    private Integer totalGoods;

    public GoodsShipmentRecord() {
    }

    public GoodsShipmentRecord(LocalDate sendDate, Integer totalGoods) {
        this.sendDate = sendDate;
        this.totalGoods = totalGoods;
    }

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
