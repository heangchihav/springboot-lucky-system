package com.example.marketingservice.entity.goods;

import com.example.marketingservice.entity.member.VipMember;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_goods_shipments")
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
    @Column(name = "cod_shipping", nullable = false)
    private Integer codShipping;

    @Min(0)
    @Column(name = "cod_arrived", nullable = false)
    private Integer codArrived;

    @Min(0)
    @Column(name = "cod_complete", nullable = false)
    private Integer codComplete;

    @Min(0)
    @Column(name = "non_cod_shipping", nullable = false)
    private Integer nonCodShipping;

    @Min(0)
    @Column(name = "non_cod_arrived", nullable = false)
    private Integer nonCodArrived;

    @Min(0)
    @Column(name = "non_cod_complete", nullable = false)
    private Integer nonCodComplete;

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

    public Integer getCodShipping() {
        return codShipping;
    }

    public void setCodShipping(Integer codShipping) {
        this.codShipping = codShipping;
    }

    public Integer getCodArrived() {
        return codArrived;
    }

    public void setCodArrived(Integer codArrived) {
        this.codArrived = codArrived;
    }

    public Integer getCodComplete() {
        return codComplete;
    }

    public void setCodComplete(Integer codComplete) {
        this.codComplete = codComplete;
    }

    public Integer getNonCodShipping() {
        return nonCodShipping;
    }

    public void setNonCodShipping(Integer nonCodShipping) {
        this.nonCodShipping = nonCodShipping;
    }

    public Integer getNonCodArrived() {
        return nonCodArrived;
    }

    public void setNonCodArrived(Integer nonCodArrived) {
        this.nonCodArrived = nonCodArrived;
    }

    public Integer getNonCodComplete() {
        return nonCodComplete;
    }

    public void setNonCodComplete(Integer nonCodComplete) {
        this.nonCodComplete = nonCodComplete;
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
