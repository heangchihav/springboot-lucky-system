package com.example.marketingservice.repository.goods;

import com.example.marketingservice.entity.goods.MarketingGoodsShipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

public interface MarketingGoodsShipmentRepository
        extends JpaRepository<MarketingGoodsShipment, Long>, JpaSpecificationExecutor<MarketingGoodsShipment> {
    Page<MarketingGoodsShipment> findByMember_Id(Long memberId, Pageable pageable);

    Page<MarketingGoodsShipment> findByMember_Branch_Id(Long branchId, Pageable pageable);

    Optional<MarketingGoodsShipment> findByMemberIdAndSendDate(Long memberId, LocalDate sendDate);

    @Modifying
    @Transactional
    @Query("DELETE FROM MarketingGoodsShipment s WHERE s.member.id = :memberId AND s.sendDate = :sendDate")
    void deleteByMemberIdAndSendDate(@Param("memberId") Long memberId, @Param("sendDate") LocalDate sendDate);
}
