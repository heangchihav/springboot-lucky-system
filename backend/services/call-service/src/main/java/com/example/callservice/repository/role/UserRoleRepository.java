package com.example.callservice.repository.role;

import com.example.callservice.entity.role.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByRole_IdAndActiveTrue(Long roleId);

    List<UserRole> findByRole_IdAndUserIdIn(Long roleId, List<Long> userIds);

    Optional<UserRole> findByRole_IdAndUserId(Long roleId, Long userId);

    List<UserRole> findByUserIdAndActiveTrue(Long userId);

    // Custom query to find all assignments by role ID (both active and inactive)
    List<UserRole> findByRole_Id(Long roleId);

    // Custom query to delete all assignments by role ID
    @Modifying
    @Transactional
    @Query("DELETE FROM UserRole ur WHERE ur.role.id = :roleId")
    void deleteByRoleId(Long roleId);
}
