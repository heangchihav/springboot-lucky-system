package com.example.marketingservice.service.problem;

import com.example.marketingservice.dto.problem.MarketingProblemRequest;
import com.example.marketingservice.dto.problem.MarketingProblemResponse;
import com.example.marketingservice.entity.problem.MarketingProblem;
import com.example.marketingservice.repository.problem.MarketingProblemRepository;
import com.example.marketingservice.service.shared.MarketingAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class MarketingProblemService {

    private final MarketingProblemRepository problemRepository;

    @Autowired
    private MarketingAuthorizationService authorizationService;

    public MarketingProblemService(MarketingProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    @Transactional(readOnly = true)
    public List<MarketingProblemResponse> getAllProblems() {
        return problemRepository.findAllOrderByCreatedAtDesc()
                .stream()
                .map(MarketingProblemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<MarketingProblemResponse> getProblemById(Long id) {
        return problemRepository.findById(id)
                .map(MarketingProblemResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<MarketingProblemResponse> searchProblemsByName(String name) {
        return problemRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(MarketingProblemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public MarketingProblemResponse createProblem(MarketingProblemRequest request) {
        return createProblem(request, null);
    }

    public MarketingProblemResponse createProblem(MarketingProblemRequest request, Long createdBy) {
        // Check if problem with the same name already exists
        if (problemRepository.existsByName(request.getName().trim())) {
            throw new IllegalArgumentException("Problem with name '" + request.getName() + "' already exists");
        }

        MarketingProblem problem = new MarketingProblem(request.getName().trim(), createdBy);
        MarketingProblem savedProblem = problemRepository.save(problem);

        return MarketingProblemResponse.fromEntity(savedProblem);
    }

    public MarketingProblemResponse updateProblem(Long id, MarketingProblemRequest request, Long userId) {
        MarketingProblem problem = problemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));

        authorizationService.validateCreator(userId, problem.getCreatedBy(), "problem");

        // Check if another problem with the same name already exists (excluding current
        // problem)
        Optional<MarketingProblem> existingProblem = problemRepository.findByName(request.getName().trim());
        if (existingProblem.isPresent() && !existingProblem.get().getId().equals(id)) {
            throw new IllegalArgumentException("Problem with name '" + request.getName() + "' already exists");
        }

        problem.setName(request.getName().trim());
        MarketingProblem updatedProblem = problemRepository.save(problem);

        return MarketingProblemResponse.fromEntity(updatedProblem);
    }

    public void deleteProblem(Long id, Long userId) {
        MarketingProblem problem = problemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));

        authorizationService.validateCreator(userId, problem.getCreatedBy(), "problem");

        problemRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return problemRepository.existsById(id);
    }

    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return problemRepository.existsByName(name.trim());
    }

    @Transactional(readOnly = true)
    public long count() {
        return problemRepository.count();
    }
}
