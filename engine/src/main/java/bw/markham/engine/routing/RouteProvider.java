package bw.markham.engine.routing;

public interface RouteProvider {
    boolean isConfigured();

    RouteMetrics route(double originLatitude, double originLongitude, double destinationLatitude, double destinationLongitude);
}