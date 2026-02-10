package com.example.marketingservice.service.user;

import com.example.marketingservice.dto.user.MarketingUserProfileRequest;
import com.example.marketingservice.dto.user.MarketingUserProfileResponse;
import com.example.marketingservice.entity.user.MarketingUserProfile;
import com.example.marketingservice.repository.user.MarketingUserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class MarketingUserProfileService {

    @Autowired
    private MarketingUserProfileRepository profileRepository;

    public MarketingUserProfileResponse getProfileByUserId(Long userId) {
        Optional<MarketingUserProfile> profile = profileRepository.findByUserId(userId);
        return profile.map(MarketingUserProfileResponse::fromEntity).orElse(null);
    }

    public MarketingUserProfileResponse createOrUpdateProfile(Long userId, MarketingUserProfileRequest request) {
        Optional<MarketingUserProfile> existingProfile = profileRepository.findByUserId(userId);
        
        MarketingUserProfile profile;
        if (existingProfile.isPresent()) {
            profile = existingProfile.get();
        } else {
            profile = new MarketingUserProfile();
            profile.setUserId(userId);
        }

        profile.setDepartmentManager(request.getDepartmentManager());
        profile.setManagerName(request.getManagerName());
        profile.setUserSignature(request.getUserSignature());

        MarketingUserProfile savedProfile = profileRepository.save(profile);
        return MarketingUserProfileResponse.fromEntity(savedProfile);
    }

    public void deleteProfile(Long userId) {
        profileRepository.deleteByUserId(userId);
    }
}
