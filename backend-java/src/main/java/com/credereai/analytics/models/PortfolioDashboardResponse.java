package com.credereai.analytics.models;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PortfolioDashboardResponse {
    private List<PortfolioStats> segments;
    private List<PipelineEntity> activePipeline;
}
