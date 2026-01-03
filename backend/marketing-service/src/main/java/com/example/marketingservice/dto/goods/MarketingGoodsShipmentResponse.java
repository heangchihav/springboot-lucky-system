package com.example.marketingservice.dto.goods;

import com.example.marketingservice.entity.goods.MarketingGoodsShipment;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MarketingGoodsShipmentResponse {
    private Long id;
    private Long memberId;
    private String memberName;
    private Long branchId;
    private String branchName;
    private LocalDate sendDate;
    private GoodsStatus codGoods;
    private GoodsStatus nonCodGoods;
    private LocalDateTime createdAt;
    private Long createdBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public static MarketingGoodsShipmentResponse fromEntity(MarketingGoodsShipment shipment) {
        MarketingGoodsShipmentResponse response = new MarketingGoodsShipmentResponse();
        response.id = shipment.getId();
        response.memberId = shipment.getMember().getId();
        response.memberName = shipment.getMember().getName();
        response.branchId = shipment.getMember().getBranch().getId();
        response.branchName = shipment.getMember().getBranch().getName();
        response.sendDate = shipment.getSendDate();
        response.codGoods = new GoodsStatus(
                shipment.getCodShipping(),
                shipment.getCodArrived(),
                shipment.getCodComplete()
        );
        response.nonCodGoods = new GoodsStatus(
                shipment.getNonCodShipping(),
                shipment.getNonCodArrived(),
                shipment.getNonCodComplete()
        );
        response.createdAt = shipment.getCreatedAt();
        response.createdBy = shipment.getCreatedBy();
        return response;
    }

    public record GoodsStatus(int shipping, int arrived, int complete) {
    }
}
