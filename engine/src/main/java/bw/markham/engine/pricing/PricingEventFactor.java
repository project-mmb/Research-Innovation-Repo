package bw.markham.engine.pricing;

import java.math.BigDecimal;

public record PricingEventFactor(long id, String name, BigDecimal multiplier) {}