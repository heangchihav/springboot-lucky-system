package com.example.demo.user;

import com.example.demo.service.UserServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserXServiceRepository extends JpaRepository<UserXService, Long> {

    List<UserXService> findByUserId(Long userId);

    List<UserXService> findByUserIdAndActiveTrue(Long userId);

    List<UserXService> findByServiceIdAndActiveTrue(Long serviceId);

    Optional<UserXService> findByUserIdAndServiceIdAndActiveTrue(Long userId, Long serviceId);

    @Query("SELECT uxs.service FROM UserXService uxs WHERE uxs.user.id = :userId AND uxs.active = true")
    List<UserServiceEntity> findActiveServicesByUserId(@Param("userId") Long userId);

    @Query("SELECT uxs.user FROM UserXService uxs WHERE uxs.service.id = :serviceId AND uxs.active = true")
    List<User> findActiveUsersByServiceId(@Param("serviceId") Long serviceId);

    void deleteByUserIdAndServiceId(Long userId, Long serviceId);

    @Query("DELETE FROM UserXService uxs WHERE uxs.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
