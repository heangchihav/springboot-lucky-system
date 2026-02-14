package com.example.marketingservice.repository.permission;

import com.example.marketingservice.entity.permission.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByCode(String code);

    List<Permission> findByActiveTrue();

    List<Permission> findByActiveTrueOrderByName();

    List<Permission> findByCodeIn(List<String> codes);

    boolean existsByCode(String code);
}
