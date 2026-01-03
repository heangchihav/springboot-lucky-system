package com.example.marketingservice.dto.goods;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class UserGoodsRecordRequest {

    @NotNull
    @Valid
    private List<GoodsRecord> records;

    public List<GoodsRecord> getRecords() {
        return records;
    }

    public void setRecords(List<GoodsRecord> records) {
        this.records = records;
    }

    public static class GoodsRecord {
        @NotBlank
        private String userId;

        @NotNull
        private LocalDate sendDate;

        @NotNull
        @Valid
        private GoodsStatus cod_goods;

        @NotNull
        @Valid
        private GoodsStatus non_cod_goods;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public LocalDate getSendDate() {
            return sendDate;
        }

        public void setSendDate(LocalDate sendDate) {
            this.sendDate = sendDate;
        }

        public GoodsStatus getCod_goods() {
            return cod_goods;
        }

        public void setCod_goods(GoodsStatus cod_goods) {
            this.cod_goods = cod_goods;
        }

        public GoodsStatus getNon_cod_goods() {
            return non_cod_goods;
        }

        public void setNon_cod_goods(GoodsStatus non_cod_goods) {
            this.non_cod_goods = non_cod_goods;
        }
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
