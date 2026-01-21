package com.example.marketingservice.controller.goods;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.goods.MarketingGoodsShipmentResponse;
import com.example.marketingservice.dto.goods.MarketingGoodsShipmentUpdateRequest;
import com.example.marketingservice.dto.goods.UserGoodsRecordRequest;
import com.example.marketingservice.service.goods.MarketingGoodsShipmentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/marketing/goods-shipments")
public class MarketingGoodsShipmentController extends BaseController {

    private final MarketingGoodsShipmentService shipmentService;

    public MarketingGoodsShipmentController(MarketingGoodsShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @PostMapping
    public ResponseEntity<?> recordBatch(@Valid @RequestBody java.util.List<UserGoodsRecordRequest.GoodsRecord> records,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "goods.create");
        Long creatorId = requireUserId(httpRequest);
        int accepted = shipmentService.recordBatch(records, creatorId);
        return ResponseEntity.ok().body(
                java.util.Map.of(
                        "accepted", accepted));
    }

    @GetMapping
    public List<MarketingGoodsShipmentResponse> listRecent(
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long areaId,
            @RequestParam(defaultValue = "true") boolean myOnly,
            @RequestParam(required = false) String memberQuery,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "goods.view");
        Long createdBy = myOnly ? requireUserId(httpRequest) : null;
        return shipmentService.findRecent(memberId, branchId, subAreaId, areaId, createdBy, memberQuery, limit,
                startDate, endDate);
    }

    @PutMapping("/{id}")
    public MarketingGoodsShipmentResponse updateShipment(
            @PathVariable Long id,
            @Valid @RequestBody MarketingGoodsShipmentUpdateRequest request,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "goods.edit");
        Long userId = requireUserId(httpRequest);
        return shipmentService.updateShipment(id, request, userId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShipment(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "goods.delete");
        Long userId = requireUserId(httpRequest);
        shipmentService.deleteShipment(id, userId);
        return ResponseEntity.noContent().build();
    }
}
