package bw.markham.engine.booking;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BookingConfirmation(
        long id,
        long propertyId,
        LocalDate checkIn,
        LocalDate checkOut,
        BigDecimal totalPrice,
        String currency,
        String status) {}