package bw.markham.engine.property;

import bw.markham.engine.api.ResourceNotFoundException;
import bw.markham.engine.pricing.DynamicPricingEngine;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PropertyService {
    private final PropertyRepository propertyRepository;
    private final DynamicPricingEngine pricingEngine;

    public PropertyService(PropertyRepository propertyRepository, DynamicPricingEngine pricingEngine) {
        this.propertyRepository = propertyRepository;
        this.pricingEngine = pricingEngine;
    }

    public List<PropertyResponse> findProperties(String status, String district) {
        String normalizedStatus = status == null ? "ALL" : status.toUpperCase();
        if (!normalizedStatus.equals("ALL")
                && !normalizedStatus.equals("AVAILABLE")
                && !normalizedStatus.equals("UPCOMING")) {
            throw new IllegalArgumentException("Status must be ALL, AVAILABLE, or UPCOMING");
        }
        String normalizedDistrict = district == null || district.isBlank() ? null : district.trim();
        LocalDate today = LocalDate.now();
        return propertyRepository.findAll(normalizedStatus, normalizedDistrict).stream()
                .map(property -> toResponse(property, today))
                .toList();
    }

    public PropertyRecord findById(long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
    }

    public List<String> findDistricts() {
        return propertyRepository.findDistricts();
    }

    private PropertyResponse toResponse(PropertyRecord property, LocalDate date) {
        return new PropertyResponse(
                property.id(),
                property.name(),
                property.district(),
                property.area(),
                property.imageKey(),
                pricingEngine.explainForNight(property, date).finalRate(),
                property.rating(),
                property.type(),
                property.beds(),
                property.guests(),
                property.status(),
                property.tag());
    }
}