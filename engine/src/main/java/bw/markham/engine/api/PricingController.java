package bw.markham.engine.api;

import bw.markham.engine.pricing.PricingQuote;
import bw.markham.engine.pricing.PricingDecision;
import bw.markham.engine.pricing.PricingService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pricing")
public class PricingController {
    private final PricingService pricingService;

    public PricingController(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    @GetMapping("/quote")
    public PricingQuote quote(
            @RequestParam long propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        return pricingService.quote(propertyId, checkIn, checkOut);
    }

    @GetMapping("/decisions")
    public List<PricingDecision> decisions(@RequestParam(defaultValue = "25") int limit) {
        return pricingService.recentDecisions(limit);
    }
}