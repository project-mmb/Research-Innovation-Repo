package bw.markham.engine.property;

import java.math.BigDecimal;

public record PropertyResponse(
        long id,
        String name,
        String district,
        String area,
        String imageKey,
        BigDecimal price,
        BigDecimal rating,
        String type,
        int beds,
        int guests,
        String status,
        String tag) {}