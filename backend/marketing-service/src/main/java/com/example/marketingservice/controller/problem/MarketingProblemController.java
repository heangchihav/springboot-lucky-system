package com.example.marketingservice.controller.problem;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.problem.MarketingProblemRequest;
import com.example.marketingservice.dto.problem.MarketingProblemResponse;
import com.example.marketingservice.service.problem.MarketingProblemService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketing/problems")
public class MarketingProblemController extends BaseController {

    private final MarketingProblemService problemService;

    public MarketingProblemController(MarketingProblemService problemService) {
        this.problemService = problemService;
    }

    @GetMapping
    public List<MarketingProblemResponse> getAllProblems() {
        return problemService.getAllProblems();
    }

    @GetMapping("/{id}")
    public MarketingProblemResponse getProblemById(@PathVariable Long id) {
        return problemService.getProblemById(id)
                .orElseThrow(() -> new RuntimeException("Problem not found with id: " + id));
    }

    @GetMapping("/search")
    public List<MarketingProblemResponse> searchProblems(@RequestParam String name) {
        return problemService.searchProblemsByName(name);
    }

    @PostMapping
    public ResponseEntity<MarketingProblemResponse> createProblem(@Valid @RequestBody MarketingProblemRequest request,
                                                                  HttpServletRequest httpRequest) {
        Long creatorId = requireUserId(httpRequest);
        MarketingProblemResponse createdProblem = problemService.createProblem(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProblem);
    }

    @PutMapping("/{id}")
    public MarketingProblemResponse updateProblem(@PathVariable Long id, @Valid @RequestBody MarketingProblemRequest request) {
        return problemService.updateProblem(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProblem(@PathVariable Long id) {
        problemService.deleteProblem(id);
    }

    @GetMapping("/count")
    public ResponseEntity<java.util.Map<String, Long>> getProblemsCount() {
        long count = problemService.count();
        return ResponseEntity.ok(java.util.Map.of("count", count));
    }

    @GetMapping("/exists/{id}")
    public ResponseEntity<java.util.Map<String, Boolean>> checkProblemExists(@PathVariable Long id) {
        boolean exists = problemService.existsById(id);
        return ResponseEntity.ok(java.util.Map.of("exists", exists));
    }

    @GetMapping("/exists")
    public ResponseEntity<java.util.Map<String, Boolean>> checkProblemExistsByName(@RequestParam String name) {
        boolean exists = problemService.existsByName(name);
        return ResponseEntity.ok(java.util.Map.of("exists", exists));
    }
}
