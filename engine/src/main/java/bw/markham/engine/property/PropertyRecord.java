package bw.markham.engine.property;

import java.math.BigDecimal;

public record PropertyRecord(
        long id,
        String name,
        long districtId,
        String district,
        String area,
        Double latitude,
        Double longitude,
        String imageKey,
        BigDecimal basePrice,
        BigDecimal minimumRate,
        BigDecimal maximumRate,
        BigDecimal rating,
        String type,
        int beds,
        int guests,
        String status,
        String tag) {}