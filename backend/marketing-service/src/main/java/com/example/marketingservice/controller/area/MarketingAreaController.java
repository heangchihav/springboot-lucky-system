package com.example.marketingservice.controller.area;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.area.MarketingAreaRequest;
import com.example.marketingservice.dto.area.MarketingAreaResponse;
import com.example.marketingservice.service.area.MarketingAreaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketing/areas")
public class MarketingAreaController extends BaseController {

    private final MarketingAreaService marketingAreaService;

    public MarketingAreaController(MarketingAreaService marketingAreaService) {
        this.marketingAreaService = marketingAreaService;
    }

    @GetMapping
    public List<MarketingAreaResponse> list(HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "area.view");
        Long userId = requireUserId(httpRequest);
        return marketingAreaService.findAllForUser(userId)
                .stream()
                .map(MarketingAreaResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public MarketingAreaResponse get(@PathVariable Long id, HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "area.view");
        return MarketingAreaResponse.fromEntity(marketingAreaService.getById(id));
    }

    @PostMapping
    public ResponseEntity<MarketingAreaResponse> create(@Valid @RequestBody MarketingAreaRequest request,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "area.create");
        Long creatorId = requireUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MarketingAreaResponse.fromEntity(marketingAreaService.create(request, creatorId)));
    }

    @PutMapping("/{id}")
    public MarketingAreaResponse update(@PathVariable Long id, @Valid @RequestBody MarketingAreaRequest request,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "area.edit");
        Long userId = requireUserId(httpRequest);
        return MarketingAreaResponse.fromEntity(marketingAreaService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "area.delete");
        Long userId = requireUserId(httpRequest);
        marketingAreaService.delete(id, userId);
    }
}
