package bw.markham.engine.api;

import bw.markham.engine.property.PropertyResponse;
import bw.markham.engine.property.PropertyService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PropertiesController {
    private final PropertyService propertyService;

    public PropertiesController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping("/properties")
    public List<PropertyResponse> properties(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(required = false) String district) {
        return propertyService.findProperties(status, district);
    }

    @GetMapping("/districts")
    public List<String> districts() {
        return propertyService.findDistricts();
    }

    @GetMapping("/health")
    public java.util.Map<String, String> health() {
        return java.util.Map.of("status", "UP");
    }
}