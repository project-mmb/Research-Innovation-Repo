package bw.markham.engine.routing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import bw.markham.engine.property.PropertyRecord;
import bw.markham.engine.property.PropertyRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class RoutingServiceTest {
    private final PropertyRepository propertyRepository = mock(PropertyRepository.class);
    private final RouteProvider routeProvider = mock(RouteProvider.class);
    private final RoutingService routingService = new RoutingService(propertyRepository, routeProvider);

    @Test
    void routesFromGuestOriginToStoredPropertyCoordinates() {
        var property = new PropertyRecord(
                1,
                "Acacia Residence",
                4,
                "Gaborone",
                "Phakalane",
                -24.6282,
                25.9231,
                "villa",
                new BigDecimal("1250.00"),
                new BigDecimal("750.00"),
                new BigDecimal("2000.00"),
                new BigDecimal("4.98"),
                "Entire villa",
                3,
                6,
                "AVAILABLE",
                "Guest favourite");
        when(propertyRepository.findById(1)).thenReturn(Optional.of(property));
        when(routeProvider.isConfigured()).thenReturn(true);
        when(routeProvider.route(-24.65, 25.91, -24.6282, 25.9231))
                .thenReturn(new RouteMetrics(new BigDecimal("3210.5"), new BigDecimal("480.0")));

        var response = routingService.routeToProperty(
                1,
                new RouteRequest(new BigDecimal("-24.65"), new BigDecimal("25.91")));

        assertEquals(1, response.propertyId());
        assertEquals("OpenRouteService", response.provider());
        assertEquals(new BigDecimal("3210.5"), response.distanceMeters());
        assertEquals(new BigDecimal("480.0"), response.durationSeconds());
    }

    @Test
    void reportsRoutingUnavailableWhenNoProviderKeyIsConfigured() {
        when(propertyRepository.findById(1)).thenReturn(Optional.of(new PropertyRecord(
                1,
                "Acacia Residence",
                4,
                "Gaborone",
                "Phakalane",
                -24.6282,
                25.9231,
                "villa",
                new BigDecimal("1250.00"),
                new BigDecimal("750.00"),
                new BigDecimal("2000.00"),
                new BigDecimal("4.98"),
                "Entire villa",
                3,
                6,
                "AVAILABLE",
                "Guest favourite")));
        when(routeProvider.isConfigured()).thenReturn(false);

        assertThrows(
                RoutingUnavailableException.class,
                () -> routingService.routeToProperty(
                        1,
                        new RouteRequest(new BigDecimal("-24.65"), new BigDecimal("25.91"))));
    }
}