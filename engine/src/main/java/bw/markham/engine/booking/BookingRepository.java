package bw.markham.engine.booking;

import java.math.BigDecimal;
import java.sql.Statement;
import java.time.LocalDate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class BookingRepository {
    private final JdbcTemplate jdbcTemplate;

    public BookingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean hasOverlap(long propertyId, LocalDate checkIn, LocalDate checkOut) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM bookings WHERE property_id = ? AND status = 'CONFIRMED' "
                        + "AND check_in < ? AND check_out > ?",
                Integer.class,
                propertyId,
                checkOut,
                checkIn);
        return count != null && count > 0;
    }

    public long create(
            long propertyId,
            String guestName,
            String guestEmail,
            LocalDate checkIn,
            LocalDate checkOut,
            BigDecimal totalPrice) {
        var keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            var statement = connection.prepareStatement(
                    "INSERT INTO bookings (property_id, guest_name, guest_email, check_in, check_out, total_price) "
                            + "VALUES (?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, propertyId);
            statement.setString(2, guestName);
            statement.setString(3, guestEmail);
            statement.setObject(4, checkIn);
            statement.setObject(5, checkOut);
            statement.setBigDecimal(6, totalPrice);
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Booking could not be created");
        return key.longValue();
    }
}