package com.example.marketingservice.dto.goods;

import java.util.List;

public class PaginatedGroupedGoodsShipmentResponse {
    private List<GroupedGoodsShipmentResponse> data;
    private long totalCount;
    private int currentPage;
    private int pageSize;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;

    public PaginatedGroupedGoodsShipmentResponse() {}

    public PaginatedGroupedGoodsShipmentResponse(List<GroupedGoodsShipmentResponse> data, long totalCount, int currentPage, int pageSize) {
        this.data = data;
        this.totalCount = totalCount;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) totalCount / pageSize);
        this.hasNext = currentPage < totalPages;
        this.hasPrevious = currentPage > 1;
    }

    public List<GroupedGoodsShipmentResponse> getData() {
        return data;
    }

    public void setData(List<GroupedGoodsShipmentResponse> data) {
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

    public boolean isHasNext() {
        return hasNext;
    }

    public void setHasNext(boolean hasNext) {
        this.hasNext = hasNext;
    }

    public boolean isHasPrevious() {
        return hasPrevious;
    }

    public void setHasPrevious(boolean hasPrevious) {
        this.hasPrevious = hasPrevious;
    }
}
