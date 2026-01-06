package com.example.marketingservice.service.competitor;

import com.example.marketingservice.dto.competitor.MarketingCompetitorRequest;
import com.example.marketingservice.dto.competitor.MarketingCompetitorResponse;
import com.example.marketingservice.entity.competitor.MarketingCompetitor;
import com.example.marketingservice.repository.competitor.MarketingCompetitorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class MarketingCompetitorService {

    private final MarketingCompetitorRepository competitorRepository;

    public MarketingCompetitorService(MarketingCompetitorRepository competitorRepository) {
        this.competitorRepository = competitorRepository;
    }

    @Transactional(readOnly = true)
    public List<MarketingCompetitorResponse> getAllCompetitors() {
        return competitorRepository.findAllOrderByCreatedAtDesc()
                .stream()
                .map(MarketingCompetitorResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<MarketingCompetitorResponse> getCompetitorById(Long id) {
        return competitorRepository.findById(id)
                .map(MarketingCompetitorResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<MarketingCompetitorResponse> searchCompetitorsByName(String name) {
        return competitorRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(MarketingCompetitorResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public MarketingCompetitorResponse createCompetitor(MarketingCompetitorRequest request) {
        return createCompetitor(request, null);
    }

    public MarketingCompetitorResponse createCompetitor(MarketingCompetitorRequest request, Long createdBy) {
        if (competitorRepository.existsByName(request.getName().trim())) {
            throw new IllegalArgumentException("Competitor with name '" + request.getName() + "' already exists");
        }

        MarketingCompetitor competitor = new MarketingCompetitor(request.getName().trim(), createdBy);
        MarketingCompetitor savedCompetitor = competitorRepository.save(competitor);

        return MarketingCompetitorResponse.fromEntity(savedCompetitor);
    }

    public MarketingCompetitorResponse updateCompetitor(Long id, MarketingCompetitorRequest request) {
        MarketingCompetitor competitor = competitorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Competitor not found with id: " + id));

        Optional<MarketingCompetitor> existingCompetitor = competitorRepository.findByName(request.getName().trim());
        if (existingCompetitor.isPresent() && !existingCompetitor.get().getId().equals(id)) {
            throw new IllegalArgumentException("Competitor with name '" + request.getName() + "' already exists");
        }

        competitor.setName(request.getName().trim());
        MarketingCompetitor updatedCompetitor = competitorRepository.save(competitor);

        return MarketingCompetitorResponse.fromEntity(updatedCompetitor);
    }

    public void deleteCompetitor(Long id) {
        if (!competitorRepository.existsById(id)) {
            throw new IllegalArgumentException("Competitor not found with id: " + id);
        }
        competitorRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return competitorRepository.existsById(id);
    }

    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return competitorRepository.existsByName(name.trim());
    }

    @Transactional(readOnly = true)
    public long count() {
        return competitorRepository.count();
    }
}
