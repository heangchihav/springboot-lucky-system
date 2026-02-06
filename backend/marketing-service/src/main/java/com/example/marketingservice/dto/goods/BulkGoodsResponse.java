package com.example.marketingservice.dto.goods;

import java.time.LocalDateTime;
import java.util.List;

public class BulkGoodsResponse {
    
    private int totalRecords;
    private int successfulRecords;
    private int failedRecords;
    private List<String> errors;
    private LocalDateTime processedAt;
    private String batchId;
    private long processingTimeMs;

    public BulkGoodsResponse() {}

    public BulkGoodsResponse(int totalRecords, int successfulRecords, int failedRecords, 
                           List<String> errors, String batchId, long processingTimeMs) {
        this.totalRecords = totalRecords;
        this.successfulRecords = successfulRecords;
        this.failedRecords = failedRecords;
        this.errors = errors;
        this.processedAt = LocalDateTime.now();
        this.batchId = batchId;
        this.processingTimeMs = processingTimeMs;
    }

    public int getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(int totalRecords) {
        this.totalRecords = totalRecords;
    }

    public int getSuccessfulRecords() {
        return successfulRecords;
    }

    public void setSuccessfulRecords(int successfulRecords) {
        this.successfulRecords = successfulRecords;
    }

    public int getFailedRecords() {
        return failedRecords;
    }

    public void setFailedRecords(int failedRecords) {
        this.failedRecords = failedRecords;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public long getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }
}
