package com.example.callservice.repository.userbranch;

import com.example.callservice.entity.userbranch.UserBranch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBranchRepository extends JpaRepository<UserBranch, Long> {
    
    List<UserBranch> findByUserId(Long userId);
    
    List<UserBranch> findByBranchId(Long branchId);
    
    List<UserBranch> findByUserIdAndActive(Long userId, Boolean active);
    
    List<UserBranch> findByBranchIdAndActive(Long branchId, Boolean active);
    
    Optional<UserBranch> findByUserIdAndBranchId(Long userId, Long branchId);
    
    Optional<UserBranch> findByUserIdAndBranchIdAndActive(Long userId, Long branchId, Boolean active);
    
    @Query("SELECT ub FROM UserBranch ub WHERE ub.userId = :userId AND ub.active = true")
    List<UserBranch> findActiveUserBranchesByUserId(@Param("userId") Long userId);
    
    @Query("SELECT ub FROM UserBranch ub WHERE ub.branch.id = :branchId AND ub.active = true")
    List<UserBranch> findActiveUserBranchesByBranchId(@Param("branchId") Long branchId);
    
    @Query("SELECT ub FROM UserBranch ub WHERE ub.branch.area.id = :areaId AND ub.active = true")
    List<UserBranch> findActiveUserBranchesByAreaId(@Param("areaId") Long areaId);
    
    @Query("SELECT COUNT(ub) FROM UserBranch ub WHERE ub.userId = :userId AND ub.active = true")
    long countActiveBranchesForUser(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(ub) FROM UserBranch ub WHERE ub.branch.id = :branchId AND ub.active = true")
    long countActiveUsersForBranch(@Param("branchId") Long branchId);
    
    @Query("SELECT COUNT(ub) FROM UserBranch ub WHERE ub.branch.area.id = :areaId AND ub.active = true")
    long countActiveUsersInArea(@Param("areaId") Long areaId);
    
    boolean existsByUserIdAndBranchId(Long userId, Long branchId);
}
