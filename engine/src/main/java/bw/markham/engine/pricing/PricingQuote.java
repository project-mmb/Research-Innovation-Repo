package bw.markham.engine.pricing;

import java.math.BigDecimal;
import java.util.List;

public record PricingQuote(long propertyId, int nights, BigDecimal total, String currency, List<NightlyRate> rates) {}