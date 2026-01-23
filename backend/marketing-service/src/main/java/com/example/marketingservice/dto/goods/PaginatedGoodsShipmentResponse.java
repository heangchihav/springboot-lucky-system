package com.example.marketingservice.dto.goods;

import java.util.List;

public class PaginatedGoodsShipmentResponse {
    private List<MarketingGoodsShipmentResponse> data;
    private long totalCount;
    private int currentPage;
    private int pageSize;
    private int totalPages;

    public PaginatedGoodsShipmentResponse() {
    }

    public PaginatedGoodsShipmentResponse(List<MarketingGoodsShipmentResponse> data, long totalCount, int currentPage,
            int pageSize) {
        this.data = data;
        this.totalCount = totalCount;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) totalCount / pageSize);
    }

    public List<MarketingGoodsShipmentResponse> getData() {
        return data;
    }

    public void setData(List<MarketingGoodsShipmentResponse> data) {
        this.data = data;
    }

    public long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
