package com.credereai.analytics.controller;

import com.credereai.analytics.models.*;
import com.credereai.analytics.services.AnalyticsService;
import com.credereai.module1.models.Responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/portfolio")
    public ApiResponse<PortfolioDashboardResponse> getPortfolio() {
        return ApiResponse.<PortfolioDashboardResponse>builder()
            .success(true)
            .message("Portfolio data fetched")
            .data(analyticsService.getPortfolioAnalytics())
            .build();
    }

    @PostMapping("/knowledge/query")
    public ApiResponse<KnowledgeQueryResponse> queryKnowledgeHub(@RequestBody KnowledgeQueryRequest request) {
        if (request.getQuery() == null || request.getQuery().isBlank()) {
            return ApiResponse.<KnowledgeQueryResponse>builder()
                .success(false)
                .message("Query cannot be empty")
                .build();
        }
        
        return ApiResponse.<KnowledgeQueryResponse>builder()
            .success(true)
            .message("Inquiry processed")
            .data(analyticsService.answerKnowledgeQuery(request.getQuery()))
            .build();
    }

    @GetMapping("/peer-benchmarking")
    public ApiResponse<List<PeerPerformance>> getPeerBenchmarking(@RequestParam String companyName) {
        return ApiResponse.<List<PeerPerformance>>builder()
            .success(true)
            .message("Peer comparison fetched")
            .data(analyticsService.getPeerBenchmarking(companyName))
            .build();
    }
}
