package com.example.marketingservice.controller.goods;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.goods.MarketingGoodsShipmentResponse;
import com.example.marketingservice.dto.goods.MarketingGoodsShipmentUpdateRequest;
import com.example.marketingservice.dto.goods.UserGoodsRecordRequest;
import com.example.marketingservice.service.goods.MarketingGoodsShipmentService;
import com.example.marketingservice.service.userassignment.MarketingUserAssignmentService;
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
    private final MarketingUserAssignmentService userAssignmentService;

    public MarketingGoodsShipmentController(MarketingGoodsShipmentService shipmentService,
            MarketingUserAssignmentService userAssignmentService) {
        this.shipmentService = shipmentService;
        this.userAssignmentService = userAssignmentService;
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
        Long userId = requireUserId(httpRequest);

        // Apply user's hierarchy assignments when not explicitly filtering
        List<Long> branchIds = null;
        List<Long> subAreaIds = null;
        List<Long> areaIds = null;

        if (areaId == null && subAreaId == null && branchId == null) {
            var assignments = userAssignmentService.getActiveAssignmentsByUserId(userId);

            // Collect all assigned hierarchy IDs
            if (!assignments.isEmpty()) {
                branchIds = new java.util.ArrayList<>();
                subAreaIds = new java.util.ArrayList<>();
                areaIds = new java.util.ArrayList<>();

                for (var assignment : assignments) {
                    if (assignment.getBranch() != null) {
                        branchIds.add(assignment.getBranch().getId());
                    }
                    if (assignment.getSubArea() != null) {
                        subAreaIds.add(assignment.getSubArea().getId());
                    }
                    if (assignment.getArea() != null) {
                        areaIds.add(assignment.getArea().getId());
                    }
                }

                // Remove duplicates
                branchIds = branchIds.isEmpty() ? null : branchIds.stream().distinct().toList();
                subAreaIds = subAreaIds.isEmpty() ? null : subAreaIds.stream().distinct().toList();
                areaIds = areaIds.isEmpty() ? null : areaIds.stream().distinct().toList();
            }
        }

        Long createdBy = myOnly ? userId : null;
        return shipmentService.findRecent(memberId, branchId, subAreaId, areaId, createdBy, memberQuery, limit,
                startDate, endDate, branchIds, subAreaIds, areaIds);
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
