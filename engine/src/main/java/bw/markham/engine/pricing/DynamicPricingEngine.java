package bw.markham.engine.pricing;

import bw.markham.engine.property.PropertyRecord;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class DynamicPricingEngine {
    private final PricingFactorRepository factorRepository;
    private final PriceLogRepository priceLogRepository;

    public DynamicPricingEngine(PricingFactorRepository factorRepository, PriceLogRepository priceLogRepository) {
        this.factorRepository = factorRepository;
        this.priceLogRepository = priceLogRepository;
    }

    @Cacheable(
            cacheNames = "dailyPrice",
            key = "#property.id() + ':' + #property.basePrice() + ':' + #property.minimumRate() + ':' + #property.maximumRate() + ':' + #date")
    public PricingDecision explainForNight(PropertyRecord property, LocalDate date) {
        BigDecimal seasonal = factorRepository.factor(property.id(), "SEASONAL", date);
        BigDecimal demand = factorRepository.factor(property.id(), "DEMAND", date);
        var activeEvents = factorRepository.activeEvents(property.districtId(), date);
        BigDecimal eventMultiplier = activeEvents.stream()
                .map(PricingEventFactor::multiplier)
                .reduce(BigDecimal.ONE, BigDecimal::multiply);
        BigDecimal unconstrainedRate = property.basePrice()
                .multiply(seasonal)
                .multiply(demand)
                .multiply(eventMultiplier)
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal finalRate = unconstrainedRate.max(property.minimumRate()).min(property.maximumRate());
        String rateLimitAction = unconstrainedRate.compareTo(property.minimumRate()) < 0
                ? "FLOOR"
                : unconstrainedRate.compareTo(property.maximumRate()) > 0 ? "CAP" : "NONE";
        var decision = new PricingDecision(
                0,
                property.id(),
                property.name(),
                property.district(),
                date,
                null,
                property.basePrice(),
                seasonal,
                demand,
                eventMultiplier,
                unconstrainedRate,
                property.minimumRate(),
                property.maximumRate(),
                rateLimitAction,
                finalRate,
                activeEvents);
        return priceLogRepository.record(decision);
    }

    public List<PricingDecision> recentDecisions(int limit) {
        return priceLogRepository.findRecent(limit);
    }

    static BigDecimal calculate(
            BigDecimal basePrice,
            BigDecimal minimumRate,
            BigDecimal maximumRate,
            BigDecimal seasonal,
            BigDecimal demand,
            BigDecimal event) {
        BigDecimal unconstrainedRate = basePrice.multiply(seasonal).multiply(demand).multiply(event)
                .setScale(0, RoundingMode.HALF_UP);
        return unconstrainedRate.max(minimumRate).min(maximumRate);
    }
}