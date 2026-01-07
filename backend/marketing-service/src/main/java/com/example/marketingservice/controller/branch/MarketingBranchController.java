package com.example.marketingservice.controller.branch;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.branch.MarketingBranchRequest;
import com.example.marketingservice.dto.branch.MarketingBranchResponse;
import com.example.marketingservice.service.branch.MarketingBranchService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketing/branches")
public class MarketingBranchController extends BaseController {

    private final MarketingBranchService branchService;

    public MarketingBranchController(MarketingBranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    public List<MarketingBranchResponse> list(@RequestParam(value = "areaId", required = false) Long areaId,
            @RequestParam(value = "subAreaId", required = false) Long subAreaId,
            HttpServletRequest httpRequest) {
        Long userId = requireUserId(httpRequest);
        List<MarketingBranchResponse> responses;
        if (subAreaId != null) {
            responses = branchService.findBySubAreaForUser(subAreaId, userId).stream()
                    .map(MarketingBranchResponse::fromEntity)
                    .collect(Collectors.toList());
        } else if (areaId != null) {
            responses = branchService.findByAreaForUser(areaId, userId).stream()
                    .map(MarketingBranchResponse::fromEntity)
                    .collect(Collectors.toList());
        } else {
            responses = branchService.findAllForUser(userId).stream()
                    .map(MarketingBranchResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        return responses;
    }

    @GetMapping("/{id}")
    public MarketingBranchResponse get(@PathVariable Long id) {
        return MarketingBranchResponse.fromEntity(branchService.getById(id));
    }

    @PostMapping
    public ResponseEntity<MarketingBranchResponse> create(@Valid @RequestBody MarketingBranchRequest request,
            HttpServletRequest httpRequest) {
        Long creatorId = requireUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MarketingBranchResponse.fromEntity(branchService.create(request, creatorId)));
    }

    @PutMapping("/{id}")
    public MarketingBranchResponse update(@PathVariable Long id, @Valid @RequestBody MarketingBranchRequest request,
            HttpServletRequest httpRequest) {
        Long userId = requireUserId(httpRequest);
        return MarketingBranchResponse.fromEntity(branchService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long userId = requireUserId(httpRequest);
        branchService.delete(id, userId);
    }
}
