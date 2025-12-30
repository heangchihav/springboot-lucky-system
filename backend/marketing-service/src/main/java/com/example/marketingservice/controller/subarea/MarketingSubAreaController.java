package com.example.marketingservice.controller.subarea;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.subarea.MarketingSubAreaRequest;
import com.example.marketingservice.dto.subarea.MarketingSubAreaResponse;
import com.example.marketingservice.service.subarea.MarketingSubAreaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketing/sub-areas")
public class MarketingSubAreaController extends BaseController {

    private final MarketingSubAreaService subAreaService;

    public MarketingSubAreaController(MarketingSubAreaService subAreaService) {
        this.subAreaService = subAreaService;
    }

    @GetMapping
    public List<MarketingSubAreaResponse> list(@RequestParam(value = "areaId", required = false) Long areaId) {
        return (areaId != null ? subAreaService.findByAreaId(areaId) : subAreaService.findAll())
                .stream()
                .map(MarketingSubAreaResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public MarketingSubAreaResponse get(@PathVariable Long id) {
        return MarketingSubAreaResponse.fromEntity(subAreaService.getById(id));
    }

    @PostMapping
    public ResponseEntity<MarketingSubAreaResponse> create(@Valid @RequestBody MarketingSubAreaRequest request,
                                                           HttpServletRequest httpRequest) {
        Long creatorId = requireUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MarketingSubAreaResponse.fromEntity(subAreaService.create(request, creatorId)));
    }

    @PutMapping("/{id}")
    public MarketingSubAreaResponse update(@PathVariable Long id,
                                           @Valid @RequestBody MarketingSubAreaRequest request) {
        return MarketingSubAreaResponse.fromEntity(subAreaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        subAreaService.delete(id);
    }
}
