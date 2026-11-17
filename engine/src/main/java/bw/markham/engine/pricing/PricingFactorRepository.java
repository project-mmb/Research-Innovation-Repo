package bw.markham.engine.pricing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PricingFactorRepository {
    private final JdbcTemplate jdbcTemplate;

    public PricingFactorRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public BigDecimal factor(long propertyId, String factorType, LocalDate date) {
        List<BigDecimal> values = jdbcTemplate.query(
                "SELECT multiplier FROM pricing_factors WHERE property_id = ? AND factor_type = ? "
                        + "AND starts_on <= ? AND ends_on >= ? ORDER BY starts_on DESC LIMIT 1",
                (row, index) -> row.getBigDecimal(1),
                propertyId,
                factorType,
                date,
                date);
        return values.stream().findFirst().orElse(BigDecimal.ONE);
    }

    public BigDecimal eventMultiplier(long districtId, LocalDate date) {
        return activeEvents(districtId, date).stream()
            .map(PricingEventFactor::multiplier)
                .reduce(BigDecimal.ONE, BigDecimal::multiply);
    }

        public List<PricingEventFactor> activeEvents(long districtId, LocalDate date) {
        return jdbcTemplate.query(
            "SELECT id, name, demand_multiplier FROM pricing_events WHERE district_id = ? "
                + "AND starts_on <= ? AND ends_on >= ? ORDER BY id",
            (row, index) -> new PricingEventFactor(
                row.getLong("id"), row.getString("name"), row.getBigDecimal("demand_multiplier")),
            districtId,
            date,
            date);
        }
}