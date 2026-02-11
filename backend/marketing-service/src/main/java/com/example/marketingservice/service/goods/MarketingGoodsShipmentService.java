package com.example.marketingservice.service.goods;

import com.example.marketingservice.dto.goods.BulkGoodsResponse;
import com.example.marketingservice.dto.goods.GoodsDashboardStatsResponse;
import com.example.marketingservice.dto.goods.GoodsShipmentRecord;
import com.example.marketingservice.dto.goods.GroupedGoodsShipmentResponse;
import com.example.marketingservice.dto.goods.OptimizedBulkGoodsRequest;
import com.example.marketingservice.dto.goods.PaginatedGoodsShipmentResponse;
import com.example.marketingservice.dto.goods.PaginatedGroupedGoodsShipmentResponse;
import com.example.marketingservice.dto.goods.MarketingGoodsShipmentResponse;
import com.example.marketingservice.dto.goods.MarketingGoodsShipmentUpdateRequest;
import com.example.marketingservice.dto.goods.UserGoodsRecordRequest;
import com.example.marketingservice.entity.goods.MarketingGoodsShipment;
import com.example.marketingservice.entity.member.VipMember;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.goods.MarketingGoodsShipmentRepository;
import com.example.marketingservice.repository.member.VipMemberRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
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
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MarketingGoodsShipmentService {

    private final MarketingGoodsShipmentRepository shipmentRepository;
    private final VipMemberRepository vipMemberRepository;
    private final EntityManager entityManager;

    public MarketingGoodsShipmentService(MarketingGoodsShipmentRepository shipmentRepository,
            VipMemberRepository vipMemberRepository, EntityManager entityManager) {
        this.shipmentRepository = shipmentRepository;
        this.vipMemberRepository = vipMemberRepository;
        this.entityManager = entityManager;
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

    @Transactional
    public BulkGoodsResponse recordOptimizedBatch(OptimizedBulkGoodsRequest request, Long creatorId) {
        long startTime = System.currentTimeMillis();
        String batchId = UUID.randomUUID().toString();
        LocalDate sendDate = request.getSendDate();
        List<OptimizedBulkGoodsRequest.UserGoodsRecord> records = request.getRecords();

        List<String> errors = new ArrayList<>();
        int successfulRecords = 0;
        int failedRecords = 0;

        // For very large datasets (>5000 records), use async processing
        if (records.size() > 5000) {
            return recordOptimizedBatchAsync(request, creatorId, batchId, startTime);
        }

        // Batch size for processing
        final int BATCH_SIZE = 500;

        // Pre-validate all user IDs to fail fast
        Map<String, VipMember> memberCache = preloadMembers(records);

        // Process records in chunks to avoid memory issues
        for (int i = 0; i < records.size(); i += BATCH_SIZE) {
            int endIndex = Math.min(i + BATCH_SIZE, records.size());
            List<OptimizedBulkGoodsRequest.UserGoodsRecord> chunk = records.subList(i, endIndex);

            try {
                // Process chunk
                List<MarketingGoodsShipment> shipmentsToSave = new ArrayList<>();

                for (OptimizedBulkGoodsRequest.UserGoodsRecord record : chunk) {
                    try {
                        VipMember member = memberCache.get(record.getUserId());
                        if (member == null) {
                            errors.add("Record " + (i + chunk.indexOf(record) + 1) +
                                    ": VIP member not found: " + record.getUserId());
                            failedRecords++;
                            continue;
                        }

                        // Check if a record already exists for this member and date
                        Optional<MarketingGoodsShipment> existingRecord = shipmentRepository
                                .findByMemberIdAndSendDate(member.getId(), sendDate);

                        if (existingRecord.isPresent()) {
                            // Update existing record
                            MarketingGoodsShipment shipment = existingRecord.get();
                            shipment.setTotalGoods(record.getTotalGoods());
                            shipment.setCreatedBy(creatorId);
                            shipmentsToSave.add(shipment);
                        } else {
                            // Create new record
                            MarketingGoodsShipment shipment = new MarketingGoodsShipment();
                            shipment.setMember(member);
                            shipment.setSendDate(sendDate);
                            shipment.setTotalGoods(record.getTotalGoods());
                            shipment.setCreatedBy(creatorId);
                            shipmentsToSave.add(shipment);
                        }

                        successfulRecords++;
                    } catch (Exception e) {
                        errors.add("Record " + (i + chunk.indexOf(record) + 1) +
                                ": Error processing userId " + record.getUserId() + " - " + e.getMessage());
                        failedRecords++;
                    }
                }

                // Save chunk
                if (!shipmentsToSave.isEmpty()) {
                    shipmentRepository.saveAll(shipmentsToSave);
                    // Clear entity manager to prevent memory buildup
                    entityManager.flush();
                    entityManager.clear();
                }

            } catch (Exception e) {
                errors.add("Chunk processing error at records " + (i + 1) + "-" + endIndex + ": " + e.getMessage());
                failedRecords += chunk.size();
            }
        }

        long processingTime = System.currentTimeMillis() - startTime;

        return new BulkGoodsResponse(
                records.size(),
                successfulRecords,
                failedRecords,
                errors,
                batchId,
                processingTime);
    }

    @Transactional
    public BulkGoodsResponse recordOptimizedBatchAsync(OptimizedBulkGoodsRequest request, Long creatorId,
            String batchId, long startTime) {
        List<String> errors = new ArrayList<>();
        int successfulRecords = 0;
        int failedRecords = 0;
        LocalDate sendDate = request.getSendDate();
        List<OptimizedBulkGoodsRequest.UserGoodsRecord> records = request.getRecords();

        // For async processing, use larger batch sizes and more aggressive memory
        // management
        final int BATCH_SIZE = 1000;

        // Pre-validate all user IDs to fail fast
        Map<String, VipMember> memberCache = preloadMembers(records);

        errors.add("Processing " + records.size() + " records with optimized batch size " + BATCH_SIZE);

        // Process records in larger chunks for better performance
        for (int i = 0; i < records.size(); i += BATCH_SIZE) {
            int endIndex = Math.min(i + BATCH_SIZE, records.size());
            List<OptimizedBulkGoodsRequest.UserGoodsRecord> chunk = records.subList(i, endIndex);

            try {
                // Process chunk with optimized memory usage
                List<MarketingGoodsShipment> shipmentsToSave = new ArrayList<>();

                for (OptimizedBulkGoodsRequest.UserGoodsRecord record : chunk) {
                    try {
                        VipMember member = memberCache.get(record.getUserId());
                        if (member == null) {
                            failedRecords++;
                            continue;
                        }

                        // Use existing record check for better performance
                        Optional<MarketingGoodsShipment> existingRecord = shipmentRepository
                                .findByMemberIdAndSendDate(member.getId(), sendDate);

                        if (existingRecord.isPresent()) {
                            MarketingGoodsShipment shipment = existingRecord.get();
                            shipment.setTotalGoods(record.getTotalGoods());
                            shipment.setCreatedBy(creatorId);
                            shipmentsToSave.add(shipment);
                        } else {
                            MarketingGoodsShipment shipment = new MarketingGoodsShipment();
                            shipment.setMember(member);
                            shipment.setSendDate(sendDate);
                            shipment.setTotalGoods(record.getTotalGoods());
                            shipment.setCreatedBy(creatorId);
                            shipmentsToSave.add(shipment);
                        }

                        successfulRecords++;
                    } catch (Exception e) {
                        failedRecords++;
                    }
                }

                // Save chunk with immediate memory cleanup
                if (!shipmentsToSave.isEmpty()) {
                    shipmentRepository.saveAll(shipmentsToSave);
                    entityManager.flush();
                    entityManager.clear();
                }

                // Log progress for large datasets
                if (i % 5000 == 0) {
                    System.out.println("Processed " + Math.min(endIndex, records.size()) + " of " + records.size()
                            + " records...");
                }

            } catch (Exception e) {
                errors.add(
                        "Large batch processing error at records " + (i + 1) + "-" + endIndex + ": " + e.getMessage());
                failedRecords += chunk.size();
            }
        }

        long processingTime = System.currentTimeMillis() - startTime;

        return new BulkGoodsResponse(
                records.size(),
                successfulRecords,
                failedRecords,
                errors,
                batchId,
                processingTime);
    }

    private Map<String, VipMember> preloadMembers(List<OptimizedBulkGoodsRequest.UserGoodsRecord> records) {
        // Extract all unique user IDs
        List<Long> userIds = records.stream()
                .map(record -> Long.valueOf(record.getUserId()))
                .distinct()
                .collect(Collectors.toList());

        // Batch load all members at once
        List<VipMember> members = vipMemberRepository.findAllById(userIds);

        // Create map for fast lookup
        Map<String, VipMember> memberMap = new HashMap<>();
        for (VipMember member : members) {
            memberMap.put(member.getId().toString(), member);
        }

        return memberMap;
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

    @Transactional(readOnly = true)
    public PaginatedGoodsShipmentResponse findRecentPaginated(
            Long memberId,
            Long branchId,
            Long subAreaId,
            Long areaId,
            Long createdBy,
            String memberQuery,
            LocalDate startDate,
            LocalDate endDate,
            List<Long> branchIds,
            List<Long> subAreaIds,
            List<Long> areaIds,
            int currentPage,
            int pageSize) {

        int offset = (currentPage - 1) * pageSize;

        // First, get total count for pagination
        String countJpql = "SELECT COUNT(s) FROM MarketingGoodsShipment s " +
                "LEFT JOIN s.member m " +
                "LEFT JOIN m.branch b " +
                "LEFT JOIN b.area " +
                "LEFT JOIN b.subArea " +
                "WHERE " + buildWhereClause(memberId, branchId, subAreaId, areaId, createdBy, memberQuery, startDate,
                        endDate, branchIds, subAreaIds, areaIds);

        Query countQuery = entityManager.createQuery(countJpql, Long.class);
        setQueryParameters(countQuery, memberId, branchId, subAreaId, areaId, createdBy, memberQuery, startDate,
                endDate, branchIds, subAreaIds, areaIds);

        Long totalCount = ((Number) countQuery.getSingleResult()).longValue();

        // Use custom query with offset for better performance with large datasets
        String jpql = "SELECT s FROM MarketingGoodsShipment s " +
                "LEFT JOIN FETCH s.member m " +
                "LEFT JOIN FETCH m.branch b " +
                "LEFT JOIN FETCH b.area " +
                "LEFT JOIN FETCH b.subArea " +
                "WHERE "
                + buildWhereClause(memberId, branchId, subAreaId, areaId, createdBy, memberQuery, startDate, endDate,
                        branchIds, subAreaIds, areaIds)
                +
                " ORDER BY s.sendDate DESC, s.id DESC";

        Query query = entityManager.createQuery(jpql, MarketingGoodsShipment.class);
        query.setFirstResult(offset);
        query.setMaxResults(pageSize);

        // Set parameters
        setQueryParameters(query, memberId, branchId, subAreaId, areaId, createdBy, memberQuery, startDate, endDate,
                branchIds, subAreaIds, areaIds);

        @SuppressWarnings("unchecked")
        List<MarketingGoodsShipment> results = query.getResultList();

        List<MarketingGoodsShipmentResponse> responseList = results.stream()
                .map(MarketingGoodsShipmentResponse::fromEntity)
                .toList();

        return new PaginatedGoodsShipmentResponse(responseList, totalCount, currentPage, pageSize);
    }

    private String buildWhereClause(Long memberId, Long branchId, Long subAreaId, Long areaId, Long createdBy,
            String memberQuery, LocalDate startDate, LocalDate endDate,
            List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {
        List<String> conditions = new ArrayList<>();

        if (memberId != null) {
            conditions.add("m.id = :memberId");
        }
        if (branchId != null) {
            conditions.add("b.id = :branchId");
        } else if (branchIds != null && !branchIds.isEmpty()) {
            conditions.add("b.id IN :branchIds");
        }
        if (subAreaId != null) {
            conditions.add("b.subArea.id = :subAreaId");
        } else if (subAreaIds != null && !subAreaIds.isEmpty()) {
            conditions.add("b.subArea.id IN :subAreaIds");
        }
        if (areaId != null) {
            conditions.add("b.area.id = :areaId");
        } else if (areaIds != null && !areaIds.isEmpty()) {
            conditions.add("b.area.id IN :areaIds");
        }
        if (createdBy != null) {
            conditions.add("s.createdBy = :createdBy");
        }
        if (memberQuery != null && !memberQuery.trim().isEmpty()) {
            conditions.add("(LOWER(m.name) LIKE :memberQuery OR LOWER(m.phone) LIKE :memberQuery)");
        }
        if (startDate != null) {
            conditions.add("s.sendDate >= :startDate");
        }
        if (endDate != null) {
            conditions.add("s.sendDate <= :endDate");
        }

        return String.join(" AND ", conditions);
    }

    private void setQueryParameters(Query query, Long memberId, Long branchId, Long subAreaId, Long areaId,
            Long createdBy,
            String memberQuery, LocalDate startDate, LocalDate endDate,
            List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {
        if (memberId != null)
            query.setParameter("memberId", memberId);
        if (branchId != null)
            query.setParameter("branchId", branchId);
        if (subAreaId != null)
            query.setParameter("subAreaId", subAreaId);
        if (areaId != null)
            query.setParameter("areaId", areaId);
        if (createdBy != null)
            query.setParameter("createdBy", createdBy);
        if (memberQuery != null && !memberQuery.trim().isEmpty()) {
            query.setParameter("memberQuery", "%" + memberQuery.toLowerCase() + "%");
        }
        if (startDate != null)
            query.setParameter("startDate", startDate);
        if (endDate != null)
            query.setParameter("endDate", endDate);
        if (branchIds != null && !branchIds.isEmpty())
            query.setParameter("branchIds", branchIds);
        if (subAreaIds != null && !subAreaIds.isEmpty())
            query.setParameter("subAreaIds", subAreaIds);
        if (areaIds != null && !areaIds.isEmpty())
            query.setParameter("areaIds", areaIds);
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

    @Transactional(readOnly = true)
    public GoodsDashboardStatsResponse getDashboardStats(
            Long areaId,
            Long subAreaId,
            Long branchId,
            Long memberId,
            LocalDate startDate,
            LocalDate endDate,
            List<Long> branchIds,
            List<Long> subAreaIds,
            List<Long> areaIds) {

        // Build WHERE clause for filtering
        StringBuilder whereClause = new StringBuilder("WHERE gs.send_date BETWEEN :startDate AND :endDate");

        if (areaId != null) {
            whereClause.append(" AND b.area_id = :areaId");
        } else if (areaIds != null && !areaIds.isEmpty()) {
            whereClause.append(" AND b.area_id IN :areaIds");
        }

        if (subAreaId != null) {
            whereClause.append(" AND b.sub_area_id = :subAreaId");
        } else if (subAreaIds != null && !subAreaIds.isEmpty()) {
            whereClause.append(" AND b.sub_area_id IN :subAreaIds");
        }

        if (branchId != null) {
            whereClause.append(" AND b.id = :branchId");
        } else if (branchIds != null && !branchIds.isEmpty()) {
            whereClause.append(" AND b.id IN :branchIds");
        }

        if (memberId != null) {
            whereClause.append(" AND vm.id = :memberId");
        }

        // Get status metrics (simulated - you may need to add status field to
        // shipments)
        List<GoodsDashboardStatsResponse.StatusMetric> statusMetrics = getStatusMetrics(whereClause.toString(),
                areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds, areaIds);

        // Get hierarchy totals
        List<GoodsDashboardStatsResponse.HierarchyTotal> hierarchyTotals = getHierarchyTotals(whereClause.toString(),
                areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds, areaIds);

        // Get trend data
        List<GoodsDashboardStatsResponse.DailyTrend> dailyTrends = getDailyTrends(whereClause.toString(),
                areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds, areaIds);

        List<GoodsDashboardStatsResponse.WeeklyTrend> weeklyTrends = getWeeklyTrends(whereClause.toString(),
                areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds, areaIds);

        List<GoodsDashboardStatsResponse.MonthlyTrend> monthlyTrends = getMonthlyTrends(whereClause.toString(),
                areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds, areaIds);

        // Get summary statistics
        GoodsDashboardStatsResponse.SummaryStats summaryStats = getSummaryStats(whereClause.toString(),
                areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds, areaIds);

        return new GoodsDashboardStatsResponse(statusMetrics, hierarchyTotals, dailyTrends, weeklyTrends,
                monthlyTrends, summaryStats);
    }

    private List<GoodsDashboardStatsResponse.StatusMetric> getStatusMetrics(String whereClause,
            Long areaId, Long subAreaId, Long branchId, Long memberId, LocalDate startDate, LocalDate endDate,
            List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {

        // Since the current system doesn't have status tracking, we'll return total
        // goods as "completed"
        String sql = "SELECT 'TOTAL' as metric, SUM(gs.total_goods) as total " +
                "FROM marketing_goods_shipments gs " +
                "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                "JOIN marketing_branches b ON vm.branch_id = b.id " +
                whereClause;

        Query query = entityManager.createNativeQuery(sql);
        setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds,
                areaIds);

        Object[] result = (Object[]) query.getSingleResult();

        List<GoodsDashboardStatsResponse.StatusMetric> metrics = new ArrayList<>();
        int total = result[1] != null ? ((Number) result[1]).intValue() : 0;

        // For now, all goods are considered "completed" since there's no status
        // tracking
        metrics.add(new GoodsDashboardStatsResponse.StatusMetric("TOTAL", 0, 0, total, total));

        return metrics;
    }

    private List<GoodsDashboardStatsResponse.HierarchyTotal> getHierarchyTotals(String whereClause,
            Long areaId, Long subAreaId, Long branchId, Long memberId, LocalDate startDate, LocalDate endDate,
            List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {

        List<GoodsDashboardStatsResponse.HierarchyTotal> totals = new ArrayList<>();

        // Handle sub-area specific case (when subAreaId is provided but areaId is null)
        if (subAreaId != null && (areaId == null || areaId == 0)) {
            // Sub-area is selected - show branches in this sub-area
            String sql = "SELECT b.id, b.name, SUM(gs.total_goods) as total " +
                    "FROM marketing_goods_shipments gs " +
                    "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                    "JOIN marketing_branches b ON vm.branch_id = b.id " +
                    whereClause + " GROUP BY b.id, b.name ORDER BY total DESC";

            Query query = entityManager.createNativeQuery(sql);
            setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds,
                    subAreaIds, areaIds);

            @SuppressWarnings("unchecked")
            List<Object[]> results = query.getResultList();

            for (Object[] row : results) {
                totals.add(new GoodsDashboardStatsResponse.HierarchyTotal(
                        "branch-" + row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue(),
                        "branch",
                        ((Number) row[0]).longValue(),
                        false));
            }
        } else if (areaId == null && (areaIds == null || areaIds.isEmpty())) {
            // No area selected - show all areas
            String sql = "SELECT a.id, a.name, SUM(gs.total_goods) as total " +
                    "FROM marketing_goods_shipments gs " +
                    "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                    "JOIN marketing_branches b ON vm.branch_id = b.id " +
                    "JOIN marketing_areas a ON b.area_id = a.id " +
                    whereClause + " GROUP BY a.id, a.name ORDER BY total DESC";

            Query query = entityManager.createNativeQuery(sql);
            setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds,
                    subAreaIds, areaIds);

            @SuppressWarnings("unchecked")
            List<Object[]> results = query.getResultList();

            for (Object[] row : results) {
                totals.add(new GoodsDashboardStatsResponse.HierarchyTotal(
                        "area-" + row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue(),
                        "area",
                        ((Number) row[0]).longValue(),
                        false));
            }
        } else if (branchId == null && (branchIds == null || branchIds.isEmpty())) {
            // Area is selected - show sub-areas or branches based on selection
            if (subAreaId != null) {
                // Sub-area is selected - show branches in this sub-area
                String sql = "SELECT b.id, b.name, SUM(gs.total_goods) as total " +
                        "FROM marketing_goods_shipments gs " +
                        "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                        "JOIN marketing_branches b ON vm.branch_id = b.id " +
                        whereClause + " GROUP BY b.id, b.name ORDER BY total DESC";

                Query query = entityManager.createNativeQuery(sql);
                setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds,
                        subAreaIds, areaIds);

                @SuppressWarnings("unchecked")
                List<Object[]> results = query.getResultList();

                for (Object[] row : results) {
                    totals.add(new GoodsDashboardStatsResponse.HierarchyTotal(
                            "branch-" + row[0],
                            (String) row[1],
                            ((Number) row[2]).intValue(),
                            "branch",
                            ((Number) row[0]).longValue(),
                            false));
                }
            } else if (areaId != null) {
                // Area is selected but no sub-area - check if area has sub-areas
                String sql = "SELECT COUNT(*) FROM marketing_sub_areas WHERE area_id = :areaId";
                Query countQuery = entityManager.createNativeQuery(sql);
                countQuery.setParameter("areaId", areaId);
                Number subAreaCount = (Number) countQuery.getSingleResult();

                if (subAreaCount.intValue() > 0) {
                    // Area has sub-areas - show sub-areas
                    String subAreaSql = "SELECT sa.id, sa.name, SUM(gs.total_goods) as total " +
                            "FROM marketing_goods_shipments gs " +
                            "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                            "JOIN marketing_branches b ON vm.branch_id = b.id " +
                            "JOIN marketing_sub_areas sa ON b.sub_area_id = sa.id " +
                            whereClause + " GROUP BY sa.id, sa.name ORDER BY total DESC";

                    Query query = entityManager.createNativeQuery(subAreaSql);
                    setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds,
                            subAreaIds, areaIds);

                    @SuppressWarnings("unchecked")
                    List<Object[]> results = query.getResultList();

                    for (Object[] row : results) {
                        totals.add(new GoodsDashboardStatsResponse.HierarchyTotal(
                                "subarea-" + row[0],
                                (String) row[1],
                                ((Number) row[2]).intValue(),
                                "subArea",
                                ((Number) row[0]).longValue(),
                                false));
                    }
                } else {
                    // Area has no sub-areas - show branches directly
                    String branchSql = "SELECT b.id, b.name, SUM(gs.total_goods) as total " +
                            "FROM marketing_goods_shipments gs " +
                            "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                            "JOIN marketing_branches b ON vm.branch_id = b.id " +
                            whereClause + " GROUP BY b.id, b.name ORDER BY total DESC";

                    Query query = entityManager.createNativeQuery(branchSql);
                    setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds,
                            subAreaIds, areaIds);

                    @SuppressWarnings("unchecked")
                    List<Object[]> results = query.getResultList();

                    for (Object[] row : results) {
                        totals.add(new GoodsDashboardStatsResponse.HierarchyTotal(
                                "branch-" + row[0],
                                (String) row[1],
                                ((Number) row[2]).intValue(),
                                "branch",
                                ((Number) row[0]).longValue(),
                                false));
                    }
                }
            } else {
                // No area selected - show all areas
                String sql = "SELECT a.id, a.name, SUM(gs.total_goods) as total " +
                        "FROM marketing_goods_shipments gs " +
                        "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                        "JOIN marketing_branches b ON vm.branch_id = b.id " +
                        "JOIN marketing_areas a ON b.area_id = a.id " +
                        whereClause + " GROUP BY a.id, a.name ORDER BY total DESC";

                Query query = entityManager.createNativeQuery(sql);
                setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds,
                        subAreaIds, areaIds);

                @SuppressWarnings("unchecked")
                List<Object[]> results = query.getResultList();

                for (Object[] row : results) {
                    totals.add(new GoodsDashboardStatsResponse.HierarchyTotal(
                            "area-" + row[0],
                            (String) row[1],
                            ((Number) row[2]).intValue(),
                            "area",
                            ((Number) row[0]).longValue(),
                            false));
                }
            }
        } else {
            // Show members in selected branch
            String sql = "SELECT vm.id, vm.name, SUM(gs.total_goods) as total " +
                    "FROM marketing_goods_shipments gs " +
                    "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                    "JOIN marketing_branches b ON vm.branch_id = b.id " +
                    whereClause + " GROUP BY vm.id, vm.name ORDER BY total DESC";

            Query query = entityManager.createNativeQuery(sql);
            setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds,
                    areaIds);

            @SuppressWarnings("unchecked")
            List<Object[]> results = query.getResultList();

            for (Object[] row : results) {
                totals.add(new GoodsDashboardStatsResponse.HierarchyTotal(
                        "member-" + row[0],
                        (String) row[1],
                        ((Number) row[2]).intValue(),
                        "member",
                        ((Number) row[0]).longValue(),
                        memberId != null && memberId.equals(((Number) row[0]).longValue())));
            }
        }

        return totals;
    }

    private List<GoodsDashboardStatsResponse.DailyTrend> getDailyTrends(String whereClause,
            Long areaId, Long subAreaId, Long branchId, Long memberId, LocalDate startDate, LocalDate endDate,
            List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {

        String sql = "SELECT gs.send_date, SUM(gs.total_goods) as total " +
                "FROM marketing_goods_shipments gs " +
                "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                "JOIN marketing_branches b ON vm.branch_id = b.id " +
                whereClause + " GROUP BY gs.send_date ORDER BY gs.send_date";

        Query query = entityManager.createNativeQuery(sql);
        setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds,
                areaIds);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        return results.stream()
                .map(row -> new GoodsDashboardStatsResponse.DailyTrend(
                        (LocalDate) row[0],
                        ((Number) row[1]).intValue()))
                .collect(Collectors.toList());
    }

    private List<GoodsDashboardStatsResponse.WeeklyTrend> getWeeklyTrends(String whereClause,
            Long areaId, Long subAreaId, Long branchId, Long memberId, LocalDate startDate, LocalDate endDate,
            List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {

        String sql = "SELECT EXTRACT(WEEK FROM gs.send_date) as week, " +
                "EXTRACT(YEAR FROM gs.send_date) as year, " +
                "SUM(gs.total_goods) as total " +
                "FROM marketing_goods_shipments gs " +
                "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                "JOIN marketing_branches b ON vm.branch_id = b.id " +
                whereClause + " GROUP BY week, year ORDER BY year, week";

        Query query = entityManager.createNativeQuery(sql);
        setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds,
                areaIds);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        return results.stream()
                .map(row -> new GoodsDashboardStatsResponse.WeeklyTrend(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).intValue(),
                        "W" + row[0] + " " + row[1],
                        ((Number) row[2]).intValue()))
                .collect(Collectors.toList());
    }

    private List<GoodsDashboardStatsResponse.MonthlyTrend> getMonthlyTrends(String whereClause,
            Long areaId, Long subAreaId, Long branchId, Long memberId, LocalDate startDate, LocalDate endDate,
            List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {

        String sql = "SELECT EXTRACT(MONTH FROM gs.send_date) as month, " +
                "EXTRACT(YEAR FROM gs.send_date) as year, " +
                "SUM(gs.total_goods) as total " +
                "FROM marketing_goods_shipments gs " +
                "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                "JOIN marketing_branches b ON vm.branch_id = b.id " +
                whereClause + " GROUP BY month, year ORDER BY year, month";

        Query query = entityManager.createNativeQuery(sql);
        setQueryParameters(query, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds,
                areaIds);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        return results.stream()
                .map(row -> new GoodsDashboardStatsResponse.MonthlyTrend(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).intValue(),
                        LocalDate.of(((Number) row[1]).intValue(), ((Number) row[0]).intValue(), 1)
                                .getMonth().toString().substring(0, 3) + " " + row[1],
                        ((Number) row[2]).intValue()))
                .collect(Collectors.toList());
    }

    private GoodsDashboardStatsResponse.SummaryStats getSummaryStats(String whereClause,
            Long areaId, Long subAreaId, Long branchId, Long memberId, LocalDate startDate, LocalDate endDate,
            List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {

        // Get total goods
        String goodsSql = "SELECT SUM(gs.total_goods) FROM marketing_goods_shipments gs " +
                "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                "JOIN marketing_branches b ON vm.branch_id = b.id " + whereClause;

        Query goodsQuery = entityManager.createNativeQuery(goodsSql);
        setQueryParameters(goodsQuery, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds, subAreaIds,
                areaIds);

        Number totalGoodsResult = (Number) goodsQuery.getSingleResult();
        int totalGoods = totalGoodsResult != null ? totalGoodsResult.intValue() : 0;

        // Get unique counts
        String membersSql = "SELECT COUNT(DISTINCT vm.id) FROM marketing_goods_shipments gs " +
                "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                "JOIN marketing_branches b ON vm.branch_id = b.id " + whereClause;

        Query membersQuery = entityManager.createNativeQuery(membersSql);
        setQueryParameters(membersQuery, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds,
                subAreaIds, areaIds);

        Number totalMembersResult = (Number) membersQuery.getSingleResult();
        int totalMembers = totalMembersResult != null ? totalMembersResult.intValue() : 0;

        String branchesSql = "SELECT COUNT(DISTINCT b.id) FROM marketing_goods_shipments gs " +
                "JOIN marketing_vip_members vm ON gs.member_id = vm.id " +
                "JOIN marketing_branches b ON vm.branch_id = b.id " + whereClause;

        Query branchesQuery = entityManager.createNativeQuery(branchesSql);
        setQueryParameters(branchesQuery, areaId, subAreaId, branchId, memberId, startDate, endDate, branchIds,
                subAreaIds, areaIds);

        Number totalBranchesResult = (Number) branchesQuery.getSingleResult();
        int totalBranches = totalBranchesResult != null ? totalBranchesResult.intValue() : 0;

        return new GoodsDashboardStatsResponse.SummaryStats(totalGoods, totalMembers, totalBranches, 0, 0);
    }

    private void setQueryParameters(Query query, Long areaId, Long subAreaId, Long branchId, Long memberId,
            LocalDate startDate, LocalDate endDate, List<Long> branchIds, List<Long> subAreaIds, List<Long> areaIds) {

        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);

        if (areaId != null) {
            query.setParameter("areaId", areaId);
        }
        if (areaIds != null && !areaIds.isEmpty()) {
            query.setParameter("areaIds", areaIds);
        }
        if (subAreaId != null) {
            query.setParameter("subAreaId", subAreaId);
        }
        if (subAreaIds != null && !subAreaIds.isEmpty()) {
            query.setParameter("subAreaIds", subAreaIds);
        }
        if (branchId != null) {
            query.setParameter("branchId", branchId);
        }
        if (branchIds != null && !branchIds.isEmpty()) {
            query.setParameter("branchIds", branchIds);
        }
        if (memberId != null) {
            query.setParameter("memberId", memberId);
        }
    }

    @Transactional(readOnly = true)
    public List<GroupedGoodsShipmentResponse> findRecentGrouped(
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
            List<Long> areaIds,
            String sortBy,
            String sortOrder) {
        // If no limit specified, use a large number to fetch all records
        int sanitizedLimit = limit != null ? Math.min(Math.max(limit, 1), 10000) : 10000;

        // Build the JPQL query to fetch shipments grouped by member
        String jpql = "SELECT DISTINCT s FROM MarketingGoodsShipment s " +
                "LEFT JOIN FETCH s.member m " +
                "LEFT JOIN FETCH m.branch b " +
                "LEFT JOIN FETCH b.area " +
                "LEFT JOIN FETCH b.subArea " +
                "WHERE " + buildWhereClause(memberId, branchId, subAreaId, areaId, createdBy, memberQuery, startDate,
                        endDate, branchIds, subAreaIds, areaIds)
                +
                " ORDER BY m.id, s.sendDate DESC";

        Query query = entityManager.createQuery(jpql, MarketingGoodsShipment.class);
        query.setMaxResults(sanitizedLimit * 2); // Fetch more to account for grouping
        setQueryParameters(query, memberId, branchId, subAreaId, areaId, createdBy, memberQuery, startDate,
                endDate, branchIds, subAreaIds, areaIds);

        @SuppressWarnings("unchecked")
        List<MarketingGoodsShipment> shipments = query.getResultList();

        // Group shipments by member
        Map<Long, GroupedGoodsShipmentResponse> groupedMap = new HashMap<>();

        for (MarketingGoodsShipment shipment : shipments) {
            Long memberIdKey = shipment.getMember().getId();

            GroupedGoodsShipmentResponse grouped = groupedMap.computeIfAbsent(memberIdKey, id -> {
                GroupedGoodsShipmentResponse response = new GroupedGoodsShipmentResponse();
                response.setMemberId(shipment.getMember().getId());
                response.setMemberName(shipment.getMember().getName());
                response.setMemberPhone(shipment.getMember().getPhone());
                response.setBranchId(shipment.getMember().getBranch().getId());
                response.setBranchName(shipment.getMember().getBranch().getName());
                response.setRecords(new ArrayList<>());
                response.setTotalGoods(0);
                return response;
            });

            // Add shipment record
            GoodsShipmentRecord record = new GoodsShipmentRecord(
                    shipment.getSendDate(),
                    shipment.getTotalGoods());
            grouped.getRecords().add(record);

            // Update total goods
            grouped.setTotalGoods(grouped.getTotalGoods() + shipment.getTotalGoods());
        }

        // Convert to list and sort by total goods descending for ranking
        List<GroupedGoodsShipmentResponse> result = new ArrayList<>(groupedMap.values());

        // Apply sorting based on parameters
        boolean ascending = "asc".equalsIgnoreCase(sortOrder);
        switch (sortBy.toLowerCase()) {
            case "totalgoods":
                result.sort((a, b) -> {
                    Integer aTotal = a.getTotalGoods() != null ? a.getTotalGoods() : 0;
                    Integer bTotal = b.getTotalGoods() != null ? b.getTotalGoods() : 0;
                    return ascending ? aTotal.compareTo(bTotal) : bTotal.compareTo(aTotal);
                });
                break;
            case "membername":
                result.sort((a, b) -> {
                    String aName = a.getMemberName() != null ? a.getMemberName() : "";
                    String bName = b.getMemberName() != null ? b.getMemberName() : "";
                    return ascending ? aName.compareToIgnoreCase(bName) : bName.compareToIgnoreCase(aName);
                });
                break;
            case "branchname":
                result.sort((a, b) -> {
                    String aBranch = a.getBranchName() != null ? a.getBranchName() : "";
                    String bBranch = b.getBranchName() != null ? b.getBranchName() : "";
                    return ascending ? aBranch.compareToIgnoreCase(bBranch) : bBranch.compareToIgnoreCase(aBranch);
                });
                break;
            case "rank":
            default:
                // Sort by total goods descending for ranking
                result.sort((a, b) -> {
                    Integer aTotal = a.getTotalGoods() != null ? a.getTotalGoods() : 0;
                    Integer bTotal = b.getTotalGoods() != null ? b.getTotalGoods() : 0;
                    return bTotal.compareTo(aTotal);
                });
                break;
        }

        // Assign ranks (always based on total goods descending)
        List<GroupedGoodsShipmentResponse> sortedForRanking = new ArrayList<>(result);
        sortedForRanking.sort((a, b) -> {
            Integer aTotal = a.getTotalGoods() != null ? a.getTotalGoods() : 0;
            Integer bTotal = b.getTotalGoods() != null ? b.getTotalGoods() : 0;
            return bTotal.compareTo(aTotal);
        });

        // Handle ties: same total goods should get same rank
        Map<Long, Integer> rankMap = new HashMap<>();
        int currentRank = 1;
        for (int i = 0; i < sortedForRanking.size(); i++) {
            GroupedGoodsShipmentResponse currentItem = sortedForRanking.get(i);
            Integer currentTotal = currentItem.getTotalGoods() != null ? currentItem.getTotalGoods() : 0;

            // If this is the first item or has different total goods than previous, assign
            // new rank
            if (i == 0 || !currentTotal.equals(
                    sortedForRanking.get(i - 1).getTotalGoods() != null ? sortedForRanking.get(i - 1).getTotalGoods()
                            : 0)) {
                currentRank = i + 1;
            }
            // If same total goods as previous, use same rank
            rankMap.put(currentItem.getMemberId(), currentRank);
        }
        for (GroupedGoodsShipmentResponse item : result) {
            item.setRank(rankMap.get(item.getMemberId()));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public PaginatedGroupedGoodsShipmentResponse findRecentGroupedPaginated(
            Long memberId,
            Long branchId,
            Long subAreaId,
            Long areaId,
            Long createdBy,
            String memberQuery,
            LocalDate startDate,
            LocalDate endDate,
            List<Long> branchIds,
            List<Long> subAreaIds,
            List<Long> areaIds,
            int currentPage,
            int pageSize,
            String sortBy,
            String sortOrder) {

        // Build the JPQL query to fetch all shipments grouped by member
        String jpql = "SELECT DISTINCT s FROM MarketingGoodsShipment s " +
                "LEFT JOIN FETCH s.member m " +
                "LEFT JOIN FETCH m.branch b " +
                "LEFT JOIN FETCH b.area " +
                "LEFT JOIN FETCH b.subArea " +
                "WHERE " + buildWhereClause(memberId, branchId, subAreaId, areaId, createdBy, memberQuery, startDate,
                        endDate, branchIds, subAreaIds, areaIds)
                +
                " ORDER BY m.id, s.sendDate DESC";

        Query query = entityManager.createQuery(jpql, MarketingGoodsShipment.class);
        setQueryParameters(query, memberId, branchId, subAreaId, areaId, createdBy, memberQuery, startDate,
                endDate, branchIds, subAreaIds, areaIds);

        @SuppressWarnings("unchecked")
        List<MarketingGoodsShipment> shipments = query.getResultList();

        // Group shipments by member
        Map<Long, GroupedGoodsShipmentResponse> groupedMap = new HashMap<>();

        for (MarketingGoodsShipment shipment : shipments) {
            Long memberIdKey = shipment.getMember().getId();

            GroupedGoodsShipmentResponse grouped = groupedMap.computeIfAbsent(memberIdKey, id -> {
                GroupedGoodsShipmentResponse response = new GroupedGoodsShipmentResponse();
                response.setMemberId(shipment.getMember().getId());
                response.setMemberName(shipment.getMember().getName());
                response.setMemberPhone(shipment.getMember().getPhone());
                response.setBranchId(shipment.getMember().getBranch().getId());
                response.setBranchName(shipment.getMember().getBranch().getName());
                response.setRecords(new ArrayList<>());
                response.setTotalGoods(0);
                return response;
            });

            // Add shipment record
            GoodsShipmentRecord record = new GoodsShipmentRecord(
                    shipment.getSendDate(),
                    shipment.getTotalGoods());
            grouped.getRecords().add(record);

            // Update total goods
            grouped.setTotalGoods(grouped.getTotalGoods() + shipment.getTotalGoods());
        }

        // Convert to list and apply global sorting
        List<GroupedGoodsShipmentResponse> allData = new ArrayList<>(groupedMap.values());

        // Apply sorting based on parameters
        System.out.println("DEBUG PAGINATED: sortBy=" + sortBy + ", sortOrder=" + sortOrder);
        boolean ascending = "asc".equalsIgnoreCase(sortOrder);
        switch (sortBy.toLowerCase()) {
            case "totalgoods":
                allData.sort((a, b) -> {
                    Integer aTotal = a.getTotalGoods() != null ? a.getTotalGoods() : 0;
                    Integer bTotal = b.getTotalGoods() != null ? b.getTotalGoods() : 0;
                    return ascending ? aTotal.compareTo(bTotal) : bTotal.compareTo(aTotal);
                });
                break;
            case "membername":
                allData.sort((a, b) -> {
                    String aName = a.getMemberName() != null ? a.getMemberName() : "";
                    String bName = b.getMemberName() != null ? b.getMemberName() : "";
                    return ascending ? aName.compareToIgnoreCase(bName) : bName.compareToIgnoreCase(aName);
                });
                break;
            case "branchname":
                allData.sort((a, b) -> {
                    String aBranch = a.getBranchName() != null ? a.getBranchName() : "";
                    String bBranch = b.getBranchName() != null ? b.getBranchName() : "";
                    return ascending ? aBranch.compareToIgnoreCase(bBranch) : bBranch.compareToIgnoreCase(aBranch);
                });
                break;
            default:
                // Sort by total goods descending for ranking
                allData.sort((a, b) -> {
                    Integer aTotal = a.getTotalGoods() != null ? a.getTotalGoods() : 0;
                    Integer bTotal = b.getTotalGoods() != null ? b.getTotalGoods() : 0;
                    return bTotal.compareTo(aTotal);
                });
                break;
        }

        // Calculate ranks (always based on total goods descending)
        List<GroupedGoodsShipmentResponse> sortedForRanking = new ArrayList<>(allData);
        sortedForRanking.sort((a, b) -> {
            Integer aTotal = a.getTotalGoods() != null ? a.getTotalGoods() : 0;
            Integer bTotal = b.getTotalGoods() != null ? b.getTotalGoods() : 0;
            return bTotal.compareTo(aTotal);
        });

        // Handle ties: same total goods should get same rank
        Map<Long, Integer> rankMap = new HashMap<>();
        int currentRank = 1;
        for (int i = 0; i < sortedForRanking.size(); i++) {
            GroupedGoodsShipmentResponse currentItem = sortedForRanking.get(i);
            Integer currentTotal = currentItem.getTotalGoods() != null ? currentItem.getTotalGoods() : 0;

            // If this is the first item or has different total goods than previous, assign
            // new rank
            if (i == 0 || !currentTotal.equals(
                    sortedForRanking.get(i - 1).getTotalGoods() != null ? sortedForRanking.get(i - 1).getTotalGoods()
                            : 0)) {
                currentRank = i + 1;
            }
            // If same total goods as previous, use same rank
            rankMap.put(currentItem.getMemberId(), currentRank);
        }
        for (GroupedGoodsShipmentResponse item : allData) {
            item.setRank(rankMap.get(item.getMemberId()));
        }

        // Apply pagination to the globally sorted data
        int totalCount = allData.size();
        int startIndex = (currentPage - 1) * pageSize;
        int endIndex = Math.min(startIndex + pageSize, totalCount);

        List<GroupedGoodsShipmentResponse> pageData = startIndex < totalCount ? allData.subList(startIndex, endIndex)
                : new ArrayList<>();

        return new PaginatedGroupedGoodsShipmentResponse(pageData, totalCount, currentPage, pageSize);
    }
}
