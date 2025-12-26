package com.example.callservice.repository;

import com.example.callservice.entity.UserPermission;
import com.example.callservice.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {
    
    List<UserPermission> findByUserId(Long userId);
    
    List<UserPermission> findByUserIdAndActiveTrue(Long userId);
    
    Optional<UserPermission> findByUserIdAndPermissionIdAndActiveTrue(Long userId, Long permissionId);
    
    @Query("SELECT up.permission FROM UserPermission up WHERE up.userId = :userId AND up.active = true")
    List<Permission> findPermissionsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT up.permission.code FROM UserPermission up WHERE up.userId = :userId AND up.active = true")
    List<String> findPermissionCodesByUserId(@Param("userId") Long userId);
    
        
    void deleteByUserIdAndPermissionId(Long userId, Long permissionId);
}
