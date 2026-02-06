package com.example.marketingservice.dto.goods;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public class OptimizedBulkGoodsRequest {

    @NotNull
    private LocalDate sendDate;

    @NotNull
    @Size(min = 1, max = 10000, message = "Records list must be between 1 and 10000 items")
    private List<UserGoodsRecord> records;

    public static class UserGoodsRecord {
        @NotBlank
        private String userId;

        @Min(0)
        private Integer totalGoods;

        public UserGoodsRecord() {}

        public UserGoodsRecord(String userId, Integer totalGoods) {
            this.userId = userId;
            this.totalGoods = totalGoods;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public Integer getTotalGoods() {
            return totalGoods;
        }

        public void setTotalGoods(Integer totalGoods) {
            this.totalGoods = totalGoods;
        }
    }

    public LocalDate getSendDate() {
        return sendDate;
    }

    public void setSendDate(LocalDate sendDate) {
        this.sendDate = sendDate;
    }

    public List<UserGoodsRecord> getRecords() {
        return records;
    }

    public void setRecords(List<UserGoodsRecord> records) {
        this.records = records;
    }
}
