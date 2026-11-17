package bw.markham.engine.pricing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PriceLogRepository {
    private final JdbcTemplate jdbcTemplate;

    public PriceLogRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public PricingDecision record(PricingDecision decision) {
        BigDecimal multiplier = decision.baseRate().signum() == 0
                ? BigDecimal.ONE
                : decision.finalRate().divide(decision.baseRate(), 4, RoundingMode.HALF_UP);
        var keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(
                connection -> {
                    var statement = connection.prepareStatement(
                            "INSERT INTO price_logs (property_id, effective_date, base_rate, seasonal_multiplier, "
                                    + "demand_multiplier, event_multiplier, unconstrained_rate, computed_rate, "
                                    + "multiplier_applied, rate_limit_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS);
                    statement.setLong(1, decision.propertyId());
                    statement.setObject(2, decision.effectiveDate());
                    statement.setBigDecimal(3, decision.baseRate());
                    statement.setBigDecimal(4, decision.seasonalMultiplier());
                    statement.setBigDecimal(5, decision.demandMultiplier());
                    statement.setBigDecimal(6, decision.eventMultiplier());
                    statement.setBigDecimal(7, decision.unconstrainedRate());
                    statement.setBigDecimal(8, decision.finalRate());
                    statement.setBigDecimal(9, multiplier);
                    statement.setString(10, decision.rateLimitAction());
                    return statement;
                },
                keyHolder);
        Number generatedId = keyHolder.getKeyList().stream()
                .flatMap(keys -> keys.entrySet().stream())
                .filter(entry -> entry.getKey().equalsIgnoreCase("id"))
                .map(Map.Entry::getValue)
                .filter(Number.class::isInstance)
                .map(Number.class::cast)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Pricing decision could not be logged"));
        long id = generatedId.longValue();
        for (PricingEventFactor event : decision.activeEvents()) {
            jdbcTemplate.update(
                    "INSERT INTO price_log_events (price_log_id, pricing_event_id, applied_multiplier) VALUES (?, ?, ?)",
                    id,
                    event.id(),
                    event.multiplier());
        }
        LocalDateTime recordedAt = jdbcTemplate.queryForObject(
                "SELECT recorded_at FROM price_logs WHERE id = ?", LocalDateTime.class, id);
        return withLogMetadata(decision, id, recordedAt);
    }

    public List<PricingDecision> findRecent(int limit) {
        int boundedLimit = Math.max(1, Math.min(limit, 100));
        List<PricingDecision> decisions = jdbcTemplate.query(
                "SELECT l.id, l.property_id, p.name AS property_name, d.name AS district, l.effective_date, "
                        + "l.recorded_at, l.base_rate, l.seasonal_multiplier, l.demand_multiplier, "
                        + "l.event_multiplier, l.unconstrained_rate, r.minimum_rate, r.maximum_rate, "
                        + "l.rate_limit_action, l.computed_rate FROM price_logs l "
                        + "JOIN properties p ON p.id = l.property_id JOIN districts d ON d.id = p.district_id "
                        + "JOIN property_rate_limits r ON r.property_id = p.id "
                        + "ORDER BY l.recorded_at DESC, l.id DESC LIMIT ?",
                (row, index) -> new PricingDecision(
                        row.getLong("id"),
                        row.getLong("property_id"),
                        row.getString("property_name"),
                        row.getString("district"),
                        row.getDate("effective_date").toLocalDate(),
                        row.getTimestamp("recorded_at").toLocalDateTime(),
                        row.getBigDecimal("base_rate"),
                        row.getBigDecimal("seasonal_multiplier"),
                        row.getBigDecimal("demand_multiplier"),
                        row.getBigDecimal("event_multiplier"),
                        row.getBigDecimal("unconstrained_rate"),
                        row.getBigDecimal("minimum_rate"),
                        row.getBigDecimal("maximum_rate"),
                        row.getString("rate_limit_action"),
                        row.getBigDecimal("computed_rate"),
                        List.of()),
                boundedLimit);
        return decisions.stream()
                .map(decision -> withEvents(decision, findActiveEvents(decision.id())))
                .toList();
    }

    private List<PricingEventFactor> findActiveEvents(long decisionId) {
        return jdbcTemplate.query(
                "SELECT e.id, e.name, pe.applied_multiplier FROM price_log_events pe "
                        + "JOIN pricing_events e ON e.id = pe.pricing_event_id WHERE pe.price_log_id = ? ORDER BY e.id",
                (row, index) -> new PricingEventFactor(
                        row.getLong("id"), row.getString("name"), row.getBigDecimal("applied_multiplier")),
                decisionId);
    }

    private PricingDecision withEvents(PricingDecision decision, List<PricingEventFactor> events) {
        return new PricingDecision(
                decision.id(), decision.propertyId(), decision.propertyName(), decision.district(),
                decision.effectiveDate(), decision.recordedAt(), decision.baseRate(),
                decision.seasonalMultiplier(), decision.demandMultiplier(), decision.eventMultiplier(),
                decision.unconstrainedRate(), decision.minimumRate(), decision.maximumRate(),
                decision.rateLimitAction(), decision.finalRate(), events);
    }

    private PricingDecision withLogMetadata(PricingDecision decision, long id, LocalDateTime recordedAt) {
        return new PricingDecision(
                id, decision.propertyId(), decision.propertyName(), decision.district(),
                decision.effectiveDate(), recordedAt, decision.baseRate(),
                decision.seasonalMultiplier(), decision.demandMultiplier(), decision.eventMultiplier(),
                decision.unconstrainedRate(), decision.minimumRate(), decision.maximumRate(),
                decision.rateLimitAction(), decision.finalRate(), decision.activeEvents());
    }
}