package bw.markham.engine.routing;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RouteRequest(
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal originLatitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal originLongitude) {}