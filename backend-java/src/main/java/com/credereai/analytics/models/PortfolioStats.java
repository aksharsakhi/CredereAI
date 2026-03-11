package com.credereai.analytics.models;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PortfolioStats {
    private String segmentId;
    private String label;
    private int count;
    private double totalOutstandingsCr;
    private double avgRiskScore;
    private int highRiskAlerts;
    private PortfolioHealth health;
}
