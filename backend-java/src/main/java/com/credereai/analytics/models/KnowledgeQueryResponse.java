package com.credereai.analytics.models;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class KnowledgeQueryResponse {
    private String answer;
    private List<String> sources;
    private Double confidence;
}
