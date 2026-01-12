package com.example.marketingservice.dto.goods;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class UserGoodsRecordRequest {

    @NotNull
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

        @Min(0)
        private Integer totalGoods;

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

        public Integer getTotalGoods() {
            return totalGoods;
        }

        public void setTotalGoods(Integer totalGoods) {
            this.totalGoods = totalGoods;
        }
    }
}
