package com.credereai.analytics.models;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PeerPerformance {
    private String metric;
    private String entityValue;
    private String peerAvg;
    private String status; // 'UP', 'DOWN', 'NEUTRAL'
    private String insight;
}
