package com.example.marketingservice.dto.goods;

import java.util.List;

public class GroupedGoodsShipmentResponse {
    private Long memberId;
    private String memberName;
    private String memberPhone;
    private Long branchId;
    private String branchName;
    private List<GoodsShipmentRecord> records;
    private Integer totalGoods;
    private Integer rank;

    public GroupedGoodsShipmentResponse() {
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

    public String getMemberPhone() {
        return memberPhone;
    }

    public void setMemberPhone(String memberPhone) {
        this.memberPhone = memberPhone;
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

    public List<GoodsShipmentRecord> getRecords() {
        return records;
    }

    public void setRecords(List<GoodsShipmentRecord> records) {
        this.records = records;
    }

    public Integer getTotalGoods() {
        return totalGoods;
    }

    public void setTotalGoods(Integer totalGoods) {
        this.totalGoods = totalGoods;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }
}
