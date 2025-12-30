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
    public List<MarketingAreaResponse> list() {
        return marketingAreaService.findAll()
                .stream()
                .map(MarketingAreaResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public MarketingAreaResponse get(@PathVariable Long id) {
        return MarketingAreaResponse.fromEntity(marketingAreaService.getById(id));
    }

    @PostMapping
    public ResponseEntity<MarketingAreaResponse> create(@Valid @RequestBody MarketingAreaRequest request,
                                                        HttpServletRequest httpRequest) {
        Long creatorId = requireUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MarketingAreaResponse.fromEntity(marketingAreaService.create(request, creatorId)));
    }

    @PutMapping("/{id}")
    public MarketingAreaResponse update(@PathVariable Long id, @Valid @RequestBody MarketingAreaRequest request) {
        return MarketingAreaResponse.fromEntity(marketingAreaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        marketingAreaService.delete(id);
    }
}
