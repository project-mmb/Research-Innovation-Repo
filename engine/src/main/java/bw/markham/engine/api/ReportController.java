package bw.markham.engine.api;

import bw.markham.engine.report.ReportGenerator;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    private final ReportGenerator reportGenerator;

    public ReportController(ReportGenerator reportGenerator) {
        this.reportGenerator = reportGenerator;
    }

    @GetMapping(value = "/properties.csv", produces = "text/csv")
    public ResponseEntity<String> properties() {
        return csv("properties.csv", reportGenerator.propertiesCsv());
    }

    @GetMapping(value = "/bookings.csv", produces = "text/csv")
    public ResponseEntity<String> bookings() {
        return csv("bookings.csv", reportGenerator.bookingsCsv());
    }

    private ResponseEntity<String> csv(String filename, String body) {
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(body);
    }
}