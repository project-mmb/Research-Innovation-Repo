package bw.markham.engine.pricing;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class DynamicPricingEngineTest {
    @Test
    void appliesAndRoundsBaseSeasonalDemandAndEventMultipliers() {
        BigDecimal result = DynamicPricingEngine.calculate(
                new BigDecimal("1000.00"),
                new BigDecimal("800.00"),
                new BigDecimal("1500.00"),
                new BigDecimal("1.10"),
                new BigDecimal("1.05"),
                new BigDecimal("1.15"));

        assertEquals(new BigDecimal("1328"), result);
    }

    @Test
    void capsPriceAtConfiguredMaximum() {
        BigDecimal result = DynamicPricingEngine.calculate(
                new BigDecimal("1000.00"),
                new BigDecimal("800.00"),
                new BigDecimal("1200.00"),
                new BigDecimal("1.20"),
                new BigDecimal("1.10"),
                new BigDecimal("1.15"));

        assertEquals(new BigDecimal("1200.00"), result);
    }
}