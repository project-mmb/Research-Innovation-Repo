package bw.markham.engine.routing;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OpenRouteServiceClient implements RouteProvider {
    private final RestClient restClient;
    private final String apiKey;
    private final String directionsUrl;

    public OpenRouteServiceClient(
            RestClient.Builder restClientBuilder,
            @Value("${markham.routing.openrouteservice.api-key:}") String apiKey,
            @Value("${markham.routing.openrouteservice.directions-url}") String directionsUrl) {
        this.restClient = restClientBuilder.build();
        this.apiKey = apiKey;
        this.directionsUrl = directionsUrl;
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    @Override
    public RouteMetrics route(
            double originLatitude,
            double originLongitude,
            double destinationLatitude,
            double destinationLongitude) {
        Map<String, Object> request = Map.of(
                "coordinates",
                List.of(
                        List.of(originLongitude, originLatitude),
                        List.of(destinationLongitude, destinationLatitude)),
                "instructions",
                false);

        try {
            JsonNode response = restClient.post()
                    .uri(directionsUrl)
                    .header("Authorization", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode summary = response == null ? null : response.path("routes").path(0).path("summary");
            JsonNode distance = summary == null ? null : summary.path("distance");
            JsonNode duration = summary == null ? null : summary.path("duration");
            if (distance == null || !distance.isNumber() || duration == null || !duration.isNumber()) {
                throw new RoutingProviderException("OpenRouteService returned no route summary");
            }
            return new RouteMetrics(distance.decimalValue(), duration.decimalValue());
        } catch (RestClientException exception) {
            throw new RoutingProviderException("OpenRouteService request failed", exception);
        }
    }
}