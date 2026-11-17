package bw.markham.engine.routing;

import java.math.BigDecimal;

public record PropertyRouteResponse(
        long propertyId,
        String propertyName,
        String provider,
        BigDecimal distanceMeters,
        BigDecimal durationSeconds) {}