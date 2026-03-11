package com.credereai.analytics.models;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PipelineEntity {
    private String id;
    private String companyName;
    private String stage;
    private String riskBand;
    private Double exposureCr;
    private Integer confidence;
}
