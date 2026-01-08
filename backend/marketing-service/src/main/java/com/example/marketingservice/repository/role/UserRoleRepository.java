package com.example.marketingservice.repository.role;

import com.example.marketingservice.entity.role.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByRoleIdAndActiveTrue(Long roleId);

    List<UserRole> findByRoleIdAndUserIdIn(Long roleId, List<Long> userIds);

    Optional<UserRole> findByRoleIdAndUserId(Long roleId, Long userId);

    List<UserRole> findByUserIdAndActiveTrue(Long userId);
}
