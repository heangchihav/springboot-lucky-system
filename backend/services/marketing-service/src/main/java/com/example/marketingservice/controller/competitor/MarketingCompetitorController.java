package com.example.marketingservice.controller.competitor;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.competitor.MarketingCompetitorRequest;
import com.example.marketingservice.dto.competitor.MarketingCompetitorResponse;
import com.example.marketingservice.service.competitor.MarketingCompetitorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketing/competitors")
public class MarketingCompetitorController extends BaseController {

    private final MarketingCompetitorService competitorService;

    public MarketingCompetitorController(MarketingCompetitorService competitorService) {
        this.competitorService = competitorService;
    }

    @GetMapping
    public List<MarketingCompetitorResponse> getAllCompetitors(HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.view");
        return competitorService.getAllCompetitors();
    }

    @GetMapping("/{id}")
    public MarketingCompetitorResponse getCompetitorById(@PathVariable Long id, HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.view");
        return competitorService.getCompetitorById(id)
                .orElseThrow(() -> new RuntimeException("Competitor not found with id: " + id));
    }

    @GetMapping("/search")
    public List<MarketingCompetitorResponse> searchCompetitors(@RequestParam String name,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.view");
        return competitorService.searchCompetitorsByName(name);
    }

    @PostMapping
    public ResponseEntity<MarketingCompetitorResponse> createCompetitor(
            @Valid @RequestBody MarketingCompetitorRequest request,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.create");
        Long creatorId = requireUserId(httpRequest);
        MarketingCompetitorResponse createdCompetitor = competitorService.createCompetitor(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCompetitor);
    }

    @PutMapping("/{id}")
    public MarketingCompetitorResponse updateCompetitor(@PathVariable Long id,
            @Valid @RequestBody MarketingCompetitorRequest request, HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.edit");
        return competitorService.updateCompetitor(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCompetitor(@PathVariable Long id, HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.delete");
        competitorService.deleteCompetitor(id);
    }

    @GetMapping("/count")
    public ResponseEntity<java.util.Map<String, Long>> getCompetitorsCount(HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.view");
        long count = competitorService.count();
        return ResponseEntity.ok(java.util.Map.of("count", count));
    }

    @GetMapping("/exists/{id}")
    public ResponseEntity<java.util.Map<String, Boolean>> checkCompetitorExists(@PathVariable Long id,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.view");
        boolean exists = competitorService.existsById(id);
        return ResponseEntity.ok(java.util.Map.of("exists", exists));
    }

    @GetMapping("/exists")
    public ResponseEntity<java.util.Map<String, Boolean>> checkCompetitorExistsByName(@RequestParam String name,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "competitor.view");
        boolean exists = competitorService.existsByName(name);
        return ResponseEntity.ok(java.util.Map.of("exists", exists));
    }
}
