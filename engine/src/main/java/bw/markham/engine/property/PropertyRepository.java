package bw.markham.engine.property;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class PropertyRepository {
    private static final String PROPERTY_SELECT = """
                 SELECT p.id, p.name, d.id AS district_id, d.name AS district, p.area, p.image_key,
                     pl.latitude, pl.longitude, p.base_price, limits.minimum_rate, limits.maximum_rate,
                     p.rating, p.property_type, p.bedrooms,
                     p.max_guests, p.status, p.tag
                 FROM properties p JOIN districts d ON d.id = p.district_id
                 JOIN property_rate_limits limits ON limits.property_id = p.id
                 LEFT JOIN property_locations pl ON pl.property_id = p.id
            """;

    private static final RowMapper<PropertyRecord> PROPERTY_MAPPER = (row, index) -> new PropertyRecord(
            row.getLong("id"),
            row.getString("name"),
            row.getLong("district_id"),
            row.getString("district"),
            row.getString("area"),
            row.getObject("latitude", Double.class),
            row.getObject("longitude", Double.class),
            row.getString("image_key"),
            row.getBigDecimal("base_price"),
            row.getBigDecimal("minimum_rate"),
            row.getBigDecimal("maximum_rate"),
            row.getBigDecimal("rating"),
            row.getString("property_type"),
            row.getInt("bedrooms"),
            row.getInt("max_guests"),
            row.getString("status"),
            row.getString("tag"));

    private final JdbcTemplate jdbcTemplate;

    public PropertyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PropertyRecord> findAll(String status, String district) {
        var sql = new StringBuilder(PROPERTY_SELECT).append("WHERE 1 = 1");
        var parameters = new java.util.ArrayList<Object>();
        if (!"ALL".equals(status)) {
            sql.append(" AND p.status = ?");
            parameters.add(status);
        }
        if (district != null) {
            sql.append(" AND d.name = ?");
            parameters.add(district);
        }
        sql.append(" ORDER BY p.id");
        return jdbcTemplate.query(sql.toString(), PROPERTY_MAPPER, parameters.toArray());
    }

    public Optional<PropertyRecord> findById(long id) {
        return jdbcTemplate.query(PROPERTY_SELECT + "WHERE p.id = ?", PROPERTY_MAPPER, id).stream().findFirst();
    }

    public void lockForBooking(long id) {
        List<Long> matches = jdbcTemplate.query("SELECT id FROM properties WHERE id = ? FOR UPDATE", (row, index) -> row.getLong(1), id);
        if (matches.isEmpty()) throw new bw.markham.engine.api.ResourceNotFoundException("Property not found");
    }

    public List<String> findDistricts() {
        return jdbcTemplate.query("SELECT name FROM districts ORDER BY name", (row, index) -> row.getString(1));
    }
}