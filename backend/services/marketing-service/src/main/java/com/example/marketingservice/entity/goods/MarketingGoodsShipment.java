package com.example.marketingservice.entity.goods;

import com.example.marketingservice.entity.member.VipMember;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_goods_shipments", indexes = {
        @Index(name = "idx_goods_shipment_member_date", columnList = "member_id, send_date"),
        @Index(name = "idx_goods_shipment_member", columnList = "member_id"),
        @Index(name = "idx_goods_shipment_date", columnList = "send_date"),
        @Index(name = "idx_goods_shipment_created_by", columnList = "created_by"),
        @Index(name = "idx_goods_shipment_created_at", columnList = "created_at")
})
public class MarketingGoodsShipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private VipMember member;

    @NotNull
    @Column(name = "send_date", nullable = false)
    private LocalDate sendDate;

    @Min(0)
    @Column(name = "total_goods", nullable = false)
    private Integer totalGoods;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Long createdBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public VipMember getMember() {
        return member;
    }

    public void setMember(VipMember member) {
        this.member = member;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
