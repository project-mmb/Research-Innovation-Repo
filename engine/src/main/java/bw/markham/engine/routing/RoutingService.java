package bw.markham.engine.routing;

import bw.markham.engine.api.ResourceNotFoundException;
import bw.markham.engine.property.PropertyRecord;
import bw.markham.engine.property.PropertyRepository;
import org.springframework.stereotype.Service;

@Service
public class RoutingService {
    private final PropertyRepository propertyRepository;
    private final RouteProvider routeProvider;

    public RoutingService(PropertyRepository propertyRepository, RouteProvider routeProvider) {
        this.propertyRepository = propertyRepository;
        this.routeProvider = routeProvider;
    }

    public PropertyRouteResponse routeToProperty(long propertyId, RouteRequest request) {
        PropertyRecord property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        if (!routeProvider.isConfigured()) {
            throw new RoutingUnavailableException("OpenRouteService is not configured");
        }
        if (property.latitude() == null || property.longitude() == null) {
            throw new RoutingUnavailableException("Coordinates are not configured for this property");
        }

        RouteMetrics metrics = routeProvider.route(
                request.originLatitude().doubleValue(),
                request.originLongitude().doubleValue(),
                property.latitude(),
                property.longitude());
        return new PropertyRouteResponse(
                property.id(),
                property.name(),
                "OpenRouteService",
                metrics.distanceMeters(),
                metrics.durationSeconds());
    }
}