package com.credereai.analytics.models;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PortfolioHealth {
    private int healthyPct;
    private int watchPct;
    private int nplPct;
}
