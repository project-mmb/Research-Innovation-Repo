package bw.markham.engine.report;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ReportGenerator {
    private final JdbcTemplate jdbcTemplate;

    public ReportGenerator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String propertiesCsv() {
        List<List<Object>> rows = jdbcTemplate.query(
                "SELECT p.id, p.name, d.name AS district, p.area, p.base_price, p.status "
                        + "FROM properties p JOIN districts d ON d.id = p.district_id ORDER BY p.id",
                (row, index) -> List.of(
                        row.getLong("id"),
                        row.getString("name"),
                        row.getString("district"),
                        row.getString("area"),
                        row.getBigDecimal("base_price"),
                        row.getString("status")));
        return csv(List.of("id", "name", "district", "area", "base_price_bwp", "status"), rows);
    }

    public String bookingsCsv() {
        List<List<Object>> rows = jdbcTemplate.query(
                "SELECT b.id, p.name AS property, b.check_in, b.check_out, b.total_price, b.status "
                        + "FROM bookings b JOIN properties p ON p.id = b.property_id ORDER BY b.created_at DESC",
                (row, index) -> List.of(
                        row.getLong("id"),
                        row.getString("property"),
                        row.getDate("check_in"),
                        row.getDate("check_out"),
                        row.getBigDecimal("total_price"),
                        row.getString("status")));
        return csv(List.of("booking_id", "property", "check_in", "check_out", "total_price_bwp", "status"), rows);
    }

    private String csv(List<String> headers, List<List<Object>> rows) {
        var output = new StringBuilder();
        output.append(headers.stream().map(this::escape).collect(java.util.stream.Collectors.joining(",")));
        for (List<Object> row : rows) {
            output.append('\n');
            output.append(row.stream().map(this::escape).collect(java.util.stream.Collectors.joining(",")));
        }
        return output.toString();
    }

    private String escape(Object value) {
        return "\"" + String.valueOf(value).replace("\"", "\"\"") + "\"";
    }
}