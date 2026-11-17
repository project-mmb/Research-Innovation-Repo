package bw.markham.engine.api;

import bw.markham.engine.analytics.AnalyticsEngine;
import bw.markham.engine.analytics.AnalyticsResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {
    private final AnalyticsEngine analyticsEngine;

    public AnalyticsController(AnalyticsEngine analyticsEngine) {
        this.analyticsEngine = analyticsEngine;
    }

    @GetMapping("/areas")
    public AnalyticsResponse areas(@RequestParam(defaultValue = "ACTIVITY") String metric) {
        return analyticsEngine.areas(metric);
    }
}