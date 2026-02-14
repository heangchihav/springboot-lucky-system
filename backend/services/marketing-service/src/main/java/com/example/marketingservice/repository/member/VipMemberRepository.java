package com.example.marketingservice.repository.member;

import com.example.marketingservice.entity.member.VipMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface VipMemberRepository extends JpaRepository<VipMember, Long>, JpaSpecificationExecutor<VipMember> {
        List<VipMember> findByBranchId(Long branchId);

        List<VipMember> findByBranch_SubArea_Id(Long subAreaId);

        List<VipMember> findByBranch_Area_Id(Long areaId);

        List<VipMember> findByMemberCreatedAtBetween(LocalDate start, LocalDate end);

        VipMember findByPhone(String phone);

        // Optimized queries for pagination
        @Query(value = "SELECT v.* FROM marketing_vip_members v WHERE v.branch_id = :branchId ORDER BY v.member_created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
        List<VipMember> findByBranchIdPaginated(@Param("branchId") Long branchId, @Param("offset") int offset,
                        @Param("limit") int limit);

        @Query(value = "SELECT v.* FROM marketing_vip_members v JOIN marketing_branches b ON v.branch_id = b.id WHERE b.sub_area_id = :subAreaId ORDER BY v.member_created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
        List<VipMember> findBySubAreaIdPaginated(@Param("subAreaId") Long subAreaId, @Param("offset") int offset,
                        @Param("limit") int limit);

        @Query(value = "SELECT v.* FROM marketing_vip_members v JOIN marketing_branches b ON v.branch_id = b.id WHERE b.area_id = :areaId ORDER BY v.member_created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
        List<VipMember> findByAreaIdPaginated(@Param("areaId") Long areaId, @Param("offset") int offset,
                        @Param("limit") int limit);

        @Query(value = "SELECT COUNT(*) FROM marketing_vip_members v WHERE v.branch_id = :branchId", nativeQuery = true)
        long countByBranchId(@Param("branchId") Long branchId);

        @Query(value = "SELECT COUNT(*) FROM marketing_vip_members v JOIN marketing_branches b ON v.branch_id = b.id WHERE b.sub_area_id = :subAreaId", nativeQuery = true)
        long countBySubAreaId(@Param("subAreaId") Long subAreaId);

        @Query(value = "SELECT COUNT(*) FROM marketing_vip_members v JOIN marketing_branches b ON v.branch_id = b.id WHERE b.area_id = :areaId", nativeQuery = true)
        long countByAreaId(@Param("areaId") Long areaId);

        @Query("SELECT COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL")
        long countActiveMembers();

        @Query("SELECT MIN(v.memberCreatedAt) FROM VipMember v WHERE v.memberCreatedAt IS NOT NULL")
        LocalDate findEarliestMemberCreatedAt();

        @Query("SELECT MAX(v.memberCreatedAt) FROM VipMember v WHERE v.memberCreatedAt IS NOT NULL")
        LocalDate findLatestMemberCreatedAt();

        @Query("SELECT v.branch.area.id, COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND v.branch.area.id IS NOT NULL GROUP BY v.branch.area.id")
        List<Object[]> countMembersByArea();

        @Query("SELECT v.branch.subArea.id, COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND v.branch.subArea.id IS NOT NULL GROUP BY v.branch.subArea.id")
        List<Object[]> countMembersBySubArea();

        @Query("SELECT v.branch.id, COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL GROUP BY v.branch.id")
        List<Object[]> countMembersByBranch();

        @Query("SELECT v.memberCreatedAt, COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND v.memberCreatedAt BETWEEN :start AND :end GROUP BY v.memberCreatedAt ORDER BY v.memberCreatedAt")
        List<Object[]> countMembersByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

        @Query("SELECT EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(WEEK FROM v.memberCreatedAt), COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND v.memberCreatedAt BETWEEN :start AND :end GROUP BY EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(WEEK FROM v.memberCreatedAt) ORDER BY EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(WEEK FROM v.memberCreatedAt)")
        List<Object[]> countMembersByWeekBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

        @Query("SELECT EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(MONTH FROM v.memberCreatedAt), COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND v.memberCreatedAt BETWEEN :start AND :end GROUP BY EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(MONTH FROM v.memberCreatedAt) ORDER BY EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(MONTH FROM v.memberCreatedAt)")
        List<Object[]> countMembersByMonthBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

        @Query("SELECT v.branch.area.id, COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND (:areaId IS NULL OR v.branch.area.id = :areaId) AND (:subAreaId IS NULL OR v.branch.subArea.id = :subAreaId OR v.branch.subArea IS NULL) AND (:branchId IS NULL OR v.branch.id = :branchId) AND v.branch.area.id IS NOT NULL GROUP BY v.branch.area.id")
        List<Object[]> countMembersByAreaWithFilters(@Param("areaId") Long areaId, @Param("subAreaId") Long subAreaId,
                        @Param("branchId") Long branchId);

        @Query("SELECT v.branch.subArea.id, COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND v.branch.subArea IS NOT NULL AND (:areaId IS NULL OR v.branch.area.id = :areaId) AND (:subAreaId IS NULL OR v.branch.subArea.id = :subAreaId) AND (:branchId IS NULL OR v.branch.id = :branchId) GROUP BY v.branch.subArea.id")
        List<Object[]> countMembersBySubAreaWithFilters(@Param("areaId") Long areaId,
                        @Param("subAreaId") Long subAreaId,
                        @Param("branchId") Long branchId);

        @Query("SELECT v.branch.id, COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND (:areaId IS NULL OR v.branch.area.id = :areaId) AND (:subAreaId IS NULL OR v.branch.subArea.id = :subAreaId OR v.branch.subArea IS NULL) AND (:branchId IS NULL OR v.branch.id = :branchId) GROUP BY v.branch.id")
        List<Object[]> countMembersByBranchWithFilters(@Param("areaId") Long areaId, @Param("subAreaId") Long subAreaId,
                        @Param("branchId") Long branchId);

        @Query("SELECT v.memberCreatedAt, COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND (:areaId IS NULL OR v.branch.area.id = :areaId) AND (:subAreaId IS NULL OR v.branch.subArea.id = :subAreaId OR v.branch.subArea IS NULL) AND (:branchId IS NULL OR v.branch.id = :branchId) AND v.memberCreatedAt BETWEEN :start AND :end GROUP BY v.memberCreatedAt ORDER BY v.memberCreatedAt")
        List<Object[]> countMembersByDateBetweenWithFilters(@Param("start") LocalDate start,
                        @Param("end") LocalDate end,
                        @Param("areaId") Long areaId, @Param("subAreaId") Long subAreaId,
                        @Param("branchId") Long branchId);

        @Query("SELECT EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(WEEK FROM v.memberCreatedAt), COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND (:areaId IS NULL OR v.branch.area.id = :areaId) AND (:subAreaId IS NULL OR v.branch.subArea.id = :subAreaId OR v.branch.subArea IS NULL) AND (:branchId IS NULL OR v.branch.id = :branchId) AND v.memberCreatedAt BETWEEN :start AND :end GROUP BY EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(WEEK FROM v.memberCreatedAt) ORDER BY EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(WEEK FROM v.memberCreatedAt)")
        List<Object[]> countMembersByWeekBetweenWithFilters(@Param("start") LocalDate start,
                        @Param("end") LocalDate end,
                        @Param("areaId") Long areaId, @Param("subAreaId") Long subAreaId,
                        @Param("branchId") Long branchId);

        @Query("SELECT EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(MONTH FROM v.memberCreatedAt), COUNT(v) FROM VipMember v WHERE v.memberDeletedAt IS NULL AND (:areaId IS NULL OR v.branch.area.id = :areaId) AND (:subAreaId IS NULL OR v.branch.subArea.id = :subAreaId OR v.branch.subArea IS NULL) AND (:branchId IS NULL OR v.branch.id = :branchId) AND v.memberCreatedAt BETWEEN :start AND :end GROUP BY EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(MONTH FROM v.memberCreatedAt) ORDER BY EXTRACT(YEAR FROM v.memberCreatedAt), EXTRACT(MONTH FROM v.memberCreatedAt)")
        List<Object[]> countMembersByMonthBetweenWithFilters(@Param("start") LocalDate start,
                        @Param("end") LocalDate end,
                        @Param("areaId") Long areaId, @Param("subAreaId") Long subAreaId,
                        @Param("branchId") Long branchId);
}
