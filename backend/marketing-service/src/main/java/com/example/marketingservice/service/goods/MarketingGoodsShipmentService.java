package com.example.marketingservice.service.goods;

import com.example.marketingservice.dto.goods.MarketingGoodsShipmentResponse;
import com.example.marketingservice.dto.goods.MarketingGoodsShipmentUpdateRequest;
import com.example.marketingservice.dto.goods.UserGoodsRecordRequest;
import com.example.marketingservice.entity.goods.MarketingGoodsShipment;
import com.example.marketingservice.entity.member.VipMember;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.goods.MarketingGoodsShipmentRepository;
import com.example.marketingservice.repository.member.VipMemberRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class MarketingGoodsShipmentService {

    private final MarketingGoodsShipmentRepository shipmentRepository;
    private final VipMemberRepository vipMemberRepository;

    public MarketingGoodsShipmentService(MarketingGoodsShipmentRepository shipmentRepository,
            VipMemberRepository vipMemberRepository) {
        this.shipmentRepository = shipmentRepository;
        this.vipMemberRepository = vipMemberRepository;
    }

    @Transactional
    public int recordBatch(List<UserGoodsRecordRequest.GoodsRecord> records, Long creatorId) {
        List<MarketingGoodsShipment> shipmentsToSave = new ArrayList<>();

        for (UserGoodsRecordRequest.GoodsRecord record : records) {
            VipMember member = vipMemberRepository.findById(Long.valueOf(record.getUserId()))
                    .orElseThrow(
                            () -> new ResourceNotFoundException("VIP member not found: " + record.getUserId()));

            // Check if a record already exists for this member and date
            Optional<MarketingGoodsShipment> existingRecord = shipmentRepository
                    .findByMemberIdAndSendDate(member.getId(), record.getSendDate());

            if (existingRecord.isPresent()) {
                // Update existing record with new data
                MarketingGoodsShipment shipment = existingRecord.get();
                shipment.setTotalGoods(record.getTotalGoods());
                shipment.setCreatedBy(creatorId); // Update creator to latest person who modified
                shipmentsToSave.add(shipment);
            } else {
                // Create new record
                MarketingGoodsShipment shipment = new MarketingGoodsShipment();
                shipment.setMember(member);
                shipment.setSendDate(record.getSendDate());
                shipment.setTotalGoods(record.getTotalGoods());
                shipment.setCreatedBy(creatorId);
                shipmentsToSave.add(shipment);
            }
        }

        List<MarketingGoodsShipment> savedShipments = shipmentRepository.saveAll(shipmentsToSave);
        return savedShipments.size();
    }

    @Transactional(readOnly = true)
    public List<MarketingGoodsShipmentResponse> findRecent(
            Long memberId,
            Long branchId,
            Long subAreaId,
            Long areaId,
            Long createdBy,
            String memberQuery,
            Integer limit,
            LocalDate startDate,
            LocalDate endDate,
            List<Long> branchIds,
            List<Long> subAreaIds,
            List<Long> areaIds) {
        // If no limit specified, use a large number to fetch all records
        int sanitizedLimit = limit != null ? Math.min(Math.max(limit, 1), 10000) : 10000;
        Pageable pageable = PageRequest.of(0, sanitizedLimit, Sort.by(Sort.Direction.DESC, "sendDate", "id"));

        Specification<MarketingGoodsShipment> spec = (root, query, cb) -> cb.conjunction();

        if (memberId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.join("member").get("id"), memberId));
        }

        if (branchId != null) {
            spec = spec.and((root, q, cb) -> {
                Join<MarketingGoodsShipment, VipMember> memberJoin = root.join("member");
                return cb.equal(memberJoin.join("branch").get("id"), branchId);
            });
        } else if (branchIds != null && !branchIds.isEmpty()) {
            spec = spec.and((root, q, cb) -> {
                Join<MarketingGoodsShipment, VipMember> memberJoin = root.join("member");
                return memberJoin.join("branch").get("id").in(branchIds);
            });
        }

        if (subAreaId != null) {
            spec = spec.and((root, q, cb) -> {
                Join<MarketingGoodsShipment, VipMember> memberJoin = root.join("member");
                return cb.equal(memberJoin.join("branch").join("subArea", JoinType.LEFT).get("id"), subAreaId);
            });
        } else if (subAreaIds != null && !subAreaIds.isEmpty()) {
            spec = spec.and((root, q, cb) -> {
                Join<MarketingGoodsShipment, VipMember> memberJoin = root.join("member");
                return memberJoin.join("branch").join("subArea", JoinType.LEFT).get("id").in(subAreaIds);
            });
        }

        if (areaId != null) {
            spec = spec.and((root, q, cb) -> {
                Join<MarketingGoodsShipment, VipMember> memberJoin = root.join("member");
                return cb.equal(memberJoin.join("branch").join("area").get("id"), areaId);
            });
        } else if (areaIds != null && !areaIds.isEmpty()) {
            spec = spec.and((root, q, cb) -> {
                Join<MarketingGoodsShipment, VipMember> memberJoin = root.join("member");
                return memberJoin.join("branch").join("area").get("id").in(areaIds);
            });
        }

        if (createdBy != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("createdBy"), createdBy));
        }

        if (StringUtils.hasText(memberQuery)) {
            String likePattern = "%" + memberQuery.toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> {
                Join<MarketingGoodsShipment, VipMember> memberJoin = root.join("member");
                return cb.or(
                        cb.like(cb.lower(memberJoin.get("name")), likePattern),
                        cb.like(cb.lower(memberJoin.get("phone")), likePattern));
            });
        }

        if (startDate != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("sendDate"), startDate));
        }

        if (endDate != null) {
            spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("sendDate"), endDate));
        }

        Page<MarketingGoodsShipment> page = shipmentRepository.findAll(spec, pageable);

        return page.stream()
                .map(MarketingGoodsShipmentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public MarketingGoodsShipmentResponse updateShipment(Long shipmentId,
            MarketingGoodsShipmentUpdateRequest request,
            Long requesterId) {
        MarketingGoodsShipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods shipment not found: " + shipmentId));

        requireOwnership(shipment, requesterId);

        shipment.setSendDate(request.getSendDate());
        shipment.setTotalGoods(request.getTotalGoods());

        MarketingGoodsShipment saved = shipmentRepository.save(shipment);
        return MarketingGoodsShipmentResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteShipment(Long shipmentId, Long requesterId) {
        MarketingGoodsShipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods shipment not found: " + shipmentId));

        requireOwnership(shipment, requesterId);
        shipmentRepository.delete(shipment);
    }

    private void requireOwnership(MarketingGoodsShipment shipment, Long requesterId) {
        if (requesterId == null || !requesterId.equals(shipment.getCreatedBy())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify shipments you created.");
        }
    }
}
