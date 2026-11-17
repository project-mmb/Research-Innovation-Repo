package bw.markham.engine.pricing;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NightlyRate(LocalDate date, BigDecimal price, PricingDecision decision) {}