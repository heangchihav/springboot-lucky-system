package com.example.marketingservice.repository.user;

import com.example.marketingservice.entity.user.MarketingUserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MarketingUserProfileRepository extends JpaRepository<MarketingUserProfile, Long> {

    Optional<MarketingUserProfile> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
