package com.example.marketingservice.dto.member;

import java.util.List;

public class PaginatedVipMemberResponse {
    private List<VipMemberPaginatedResponse> data;
    private long totalCount;
    private int currentPage;
    private int pageSize;
    private int totalPages;

    public PaginatedVipMemberResponse() {
    }

    public PaginatedVipMemberResponse(List<VipMemberPaginatedResponse> data, long totalCount, int currentPage,
            int pageSize) {
        this.data = data;
        this.totalCount = totalCount;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) totalCount / pageSize);
    }

    public List<VipMemberPaginatedResponse> getData() {
        return data;
    }

    public void setData(List<VipMemberPaginatedResponse> data) {
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
