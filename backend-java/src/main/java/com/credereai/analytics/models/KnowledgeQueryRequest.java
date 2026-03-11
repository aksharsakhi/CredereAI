package com.credereai.analytics.models;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KnowledgeQueryRequest {
    private String query;
    private String contextId;
}
