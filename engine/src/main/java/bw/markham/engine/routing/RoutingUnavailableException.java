package bw.markham.engine.routing;

public class RoutingUnavailableException extends RuntimeException {
    public RoutingUnavailableException(String message) {
        super(message);
    }
}