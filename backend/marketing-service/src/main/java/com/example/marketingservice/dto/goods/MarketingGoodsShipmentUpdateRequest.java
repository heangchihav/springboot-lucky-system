package com.example.marketingservice.dto.goods;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class MarketingGoodsShipmentUpdateRequest {

    @NotNull
    private LocalDate sendDate;

    @NotNull
    @Valid
    private GoodsStatus codGoods;

    @NotNull
    @Valid
    private GoodsStatus nonCodGoods;

    public LocalDate getSendDate() {
        return sendDate;
    }

    public void setSendDate(LocalDate sendDate) {
        this.sendDate = sendDate;
    }

    public GoodsStatus getCodGoods() {
        return codGoods;
    }

    public void setCodGoods(GoodsStatus codGoods) {
        this.codGoods = codGoods;
    }

    public GoodsStatus getNonCodGoods() {
        return nonCodGoods;
    }

    public void setNonCodGoods(GoodsStatus nonCodGoods) {
        this.nonCodGoods = nonCodGoods;
    }

    public static class GoodsStatus {
        @Min(0)
        private int shipping;

        @Min(0)
        private int arrived;

        @Min(0)
        private int complete;

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

        public int getComplete() {
            return complete;
        }

        public void setComplete(int complete) {
            this.complete = complete;
        }
    }
}
