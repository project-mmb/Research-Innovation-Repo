package bw.markham.engine.routing;

import java.math.BigDecimal;

public record RouteMetrics(BigDecimal distanceMeters, BigDecimal durationSeconds) {}