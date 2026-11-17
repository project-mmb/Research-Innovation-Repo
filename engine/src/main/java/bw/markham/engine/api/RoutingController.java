package bw.markham.engine.api;

import bw.markham.engine.routing.PropertyRouteResponse;
import bw.markham.engine.routing.RouteRequest;
import bw.markham.engine.routing.RoutingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/routing")
public class RoutingController {
    private final RoutingService routingService;

    public RoutingController(RoutingService routingService) {
        this.routingService = routingService;
    }

    @PostMapping("/properties/{propertyId}/route")
    public PropertyRouteResponse routeToProperty(
            @PathVariable long propertyId, @Valid @RequestBody RouteRequest request) {
        return routingService.routeToProperty(propertyId, request);
    }
}