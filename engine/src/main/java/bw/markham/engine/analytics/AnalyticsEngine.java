package bw.markham.engine.analytics;

import java.util.List;
import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsEngine {
    private static final Set<String> METRICS = Set.of("ACTIVITY", "SAFETY", "AMENITIES");

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsEngine(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AnalyticsResponse areas(String metric) {
        String normalizedMetric = metric == null ? "ACTIVITY" : metric.toUpperCase();
        if (!METRICS.contains(normalizedMetric)) {
            throw new IllegalArgumentException("Metric must be ACTIVITY, SAFETY, or AMENITIES");
        }
        List<AreaInsight> areas = jdbcTemplate.query(
                "SELECT d.name AS district, m.metric_name, m.score, m.summary FROM area_metrics m "
                        + "JOIN districts d ON d.id = m.district_id WHERE m.metric_name = ? "
                        + "AND m.measured_on = (SELECT MAX(measured_on) FROM area_metrics WHERE metric_name = ?) "
                        + "ORDER BY m.score DESC, d.name",
                (row, index) -> new AreaInsight(
                        row.getString("district"),
                        row.getString("metric_name"),
                        row.getBigDecimal("score"),
                        row.getString("summary")),
                normalizedMetric,
                normalizedMetric);
        return new AnalyticsResponse(normalizedMetric, true, areas);
    }
}