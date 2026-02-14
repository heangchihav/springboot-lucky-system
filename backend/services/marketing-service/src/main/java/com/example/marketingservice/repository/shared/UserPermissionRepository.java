package com.example.marketingservice.repository.shared;

import com.example.marketingservice.entity.shared.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {

    List<UserPermission> findByUserIdAndActiveTrue(Long userId);

    Optional<UserPermission> findByUserIdAndPermissionIdAndActiveTrue(Long userId, Long permissionId);

    @Query("SELECT p.code FROM UserPermission up JOIN up.permission p WHERE up.userId = :userId AND up.active = true AND p.active = true")
    List<String> findPermissionCodesByUserId(@Param("userId") Long userId);
}
