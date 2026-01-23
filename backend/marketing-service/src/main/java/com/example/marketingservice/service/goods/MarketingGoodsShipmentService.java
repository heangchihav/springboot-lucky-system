package com.example.marketingservice.service.goods;

import com.example.marketingservice.dto.goods.GoodsDashboardStatsResponse;
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
import java.util.List;
import java.util.Locale;
import java.util.Optional;
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
}
