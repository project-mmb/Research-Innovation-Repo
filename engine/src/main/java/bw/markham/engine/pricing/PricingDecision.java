package bw.markham.engine.pricing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PricingDecision(
        long id,
        long propertyId,
        String propertyName,
        String district,
        LocalDate effectiveDate,
        LocalDateTime recordedAt,
        BigDecimal baseRate,
        BigDecimal seasonalMultiplier,
        BigDecimal demandMultiplier,
        BigDecimal eventMultiplier,
        BigDecimal unconstrainedRate,
        BigDecimal minimumRate,
        BigDecimal maximumRate,
        String rateLimitAction,
        BigDecimal finalRate,
        List<PricingEventFactor> activeEvents) {}