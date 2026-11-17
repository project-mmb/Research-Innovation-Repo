package bw.markham.engine.analytics;

import java.util.List;

public record AnalyticsResponse(String metric, boolean illustrative, List<AreaInsight> areas) {}