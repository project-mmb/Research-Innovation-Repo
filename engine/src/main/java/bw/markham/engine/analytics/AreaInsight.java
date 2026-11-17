package bw.markham.engine.analytics;

import java.math.BigDecimal;

public record AreaInsight(String district, String metric, BigDecimal score, String summary) {}