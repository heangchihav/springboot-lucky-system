package com.example.marketingservice.service.dailyreport;

import com.example.marketingservice.dto.dailyreport.DailyReportDto;
import com.example.marketingservice.dto.dailyreport.DailyReportDto.DailyReportItemDto;
import com.example.marketingservice.entity.dailyreport.DailyReport;
import com.example.marketingservice.entity.dailyreport.DailyReportItem;
import com.example.marketingservice.repository.dailyreport.DailyReportRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class DailyReportService {

    @Autowired
    private DailyReportRepository dailyReportRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${user.service.url:http://gateway:8080}")
    private String userServiceUrl;

    private Map<String, String> userFullNameCache = new java.util.concurrent.ConcurrentHashMap<>();

    public List<DailyReportDto> getAllReports() {
        List<DailyReport> reports = dailyReportRepository.findAllByOrderByCreatedAtDesc();
        return reports.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public DailyReportDto getReportById(String reportId) {
        DailyReport report = dailyReportRepository.findByReportId(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));
        return convertToDto(report);
    }

    public List<DailyReportDto> getReportsByDate(String reportDate) {
        List<DailyReport> reports = dailyReportRepository.findByReportDateOrderByReportDateDesc(reportDate);
        return reports.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<DailyReportDto> getReportsByCreatedBy(String createdBy) {
        List<DailyReport> reports = dailyReportRepository.findByCreatedByOrderByCreatedAtDesc(createdBy);
        return reports.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public DailyReportDto createReport(String createdBy, String reportDate, List<DailyReportItemDto> itemDtos) {
        // Generate unique report ID
        String reportId = generateReportId();

        // Convert DTOs to entities
        List<DailyReportItem> items = itemDtos.stream()
                .filter(itemDto -> itemDto.getName() != null && !itemDto.getName().trim().isEmpty()
                        && itemDto.getValues() != null && !itemDto.getValues().isEmpty()
                        && itemDto.getValues().stream().anyMatch(v -> v != null && !v.trim().isEmpty()))
                .map(itemDto -> {
                    List<String> validValues = itemDto.getValues().stream()
                            .filter(value -> value != null && !value.trim().isEmpty())
                            .collect(Collectors.toList());
                    return new DailyReportItem(itemDto.getName(), validValues);
                })
                .collect(Collectors.toList());

        if (items.isEmpty()) {
            throw new IllegalArgumentException("At least one valid item with values is required");
        }

        DailyReport report = new DailyReport(reportId, createdBy, reportDate, items);
        DailyReport savedReport = dailyReportRepository.save(report);

        return convertToDto(savedReport);
    }

    public DailyReportDto updateReport(String reportId, String reportDate, List<DailyReportItemDto> itemDtos) {
        DailyReport existingReport = dailyReportRepository.findByReportId(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));

        // Update report date
        existingReport.setReportDate(reportDate);

        // Convert and update items
        List<DailyReportItem> items = itemDtos.stream()
                .filter(itemDto -> itemDto.getName() != null && !itemDto.getName().trim().isEmpty()
                        && itemDto.getValues() != null && !itemDto.getValues().isEmpty()
                        && itemDto.getValues().stream().anyMatch(v -> v != null && !v.trim().isEmpty()))
                .map(itemDto -> {
                    List<String> validValues = itemDto.getValues().stream()
                            .filter(value -> value != null && !value.trim().isEmpty())
                            .collect(Collectors.toList());
                    return new DailyReportItem(itemDto.getName(), validValues);
                })
                .collect(Collectors.toList());

        if (items.isEmpty()) {
            throw new IllegalArgumentException("At least one valid item with values is required");
        }

        existingReport.setItems(items);
        DailyReport updatedReport = dailyReportRepository.save(existingReport);

        return convertToDto(updatedReport);
    }

    public void deleteReport(String reportId) {
        DailyReport report = dailyReportRepository.findByReportId(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));
        dailyReportRepository.delete(report);
    }

    private String generateReportId() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "report_" + timestamp + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String getUserFullName(String username) {
        if (username == null)
            return null;

        // Check cache first
        return userFullNameCache.computeIfAbsent(username, user -> {
            try {
                String url = userServiceUrl + "/api/users/username/" + user + "/fullname";
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);
                if (response != null && response.containsKey("fullName")) {
                    return (String) response.get("fullName");
                }
            } catch (Exception e) {
                // Log error but don't fail the report generation
                System.err.println("Error fetching user full name for " + user + ": " + e.getMessage());
            }
            return username; // Fallback to username if full name not found
        });
    }

    private DailyReportDto convertToDto(DailyReport report) {
        List<DailyReportItemDto> itemDtos = report.getItems().stream()
                .map(item -> new DailyReportItemDto(item.getItemName(), item.getValues()))
                .collect(Collectors.toList());

        String createdByFullName = getUserFullName(report.getCreatedBy());

        return new DailyReportDto(
                report.getReportId(),
                report.getCreatedBy(),
                createdByFullName,
                report.getReportDate(),
                report.getCreatedAt(),
                report.getUpdatedAt(),
                itemDtos);
    }
}
