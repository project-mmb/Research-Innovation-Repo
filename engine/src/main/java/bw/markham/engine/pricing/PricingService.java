package bw.markham.engine.pricing;

import bw.markham.engine.api.ResourceNotFoundException;
import bw.markham.engine.property.PropertyRecord;
import bw.markham.engine.property.PropertyRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import org.springframework.stereotype.Service;

@Service
public class PricingService {
    private static final int MAX_NIGHTS = 60;

    private final PropertyRepository propertyRepository;
    private final DynamicPricingEngine pricingEngine;

    public PricingService(PropertyRepository propertyRepository, DynamicPricingEngine pricingEngine) {
        this.propertyRepository = propertyRepository;
        this.pricingEngine = pricingEngine;
    }

    public PricingQuote quote(long propertyId, LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }
        if (checkIn.isBefore(LocalDate.now())) throw new IllegalArgumentException("Check-in cannot be in the past");
        long nights = java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights > MAX_NIGHTS) throw new IllegalArgumentException("A quote can cover at most 60 nights");

        PropertyRecord property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));
        var rates = new ArrayList<NightlyRate>();
        BigDecimal total = BigDecimal.ZERO;
        for (LocalDate date = checkIn; date.isBefore(checkOut); date = date.plusDays(1)) {
            PricingDecision decision = pricingEngine.explainForNight(property, date);
            rates.add(new NightlyRate(date, decision.finalRate(), decision));
            total = total.add(decision.finalRate());
        }
        return new PricingQuote(propertyId, (int) nights, total, "BWP", rates);
    }

    public java.util.List<PricingDecision> recentDecisions(int limit) {
        return pricingEngine.recentDecisions(limit);
    }
}