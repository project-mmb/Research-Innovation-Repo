package bw.markham.engine.booking;

import bw.markham.engine.pricing.PricingService;
import bw.markham.engine.property.PropertyRepository;
import bw.markham.engine.property.PropertyService;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private static final long MAX_NIGHTS = 60;

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyService propertyService;
    private final PricingService pricingService;

    public BookingService(
            BookingRepository bookingRepository,
            PropertyRepository propertyRepository,
            PropertyService propertyService,
            PricingService pricingService) {
        this.bookingRepository = bookingRepository;
        this.propertyRepository = propertyRepository;
        this.propertyService = propertyService;
        this.pricingService = pricingService;
    }

    @Transactional
    public BookingConfirmation create(BookingRequest request) {
        if (!request.checkOut().isAfter(request.checkIn())) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }
        if (request.checkIn().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Check-in cannot be in the past");
        }
        if (ChronoUnit.DAYS.between(request.checkIn(), request.checkOut()) > MAX_NIGHTS) {
            throw new IllegalArgumentException("A booking can cover at most 60 nights");
        }

        propertyRepository.lockForBooking(request.propertyId());
        var property = propertyService.findById(request.propertyId());
        if (!property.status().equals("AVAILABLE")) {
            throw new IllegalStateException("This property is not open for booking");
        }
        if (bookingRepository.hasOverlap(request.propertyId(), request.checkIn(), request.checkOut())) {
            throw new IllegalStateException("The property is already booked for some of those dates");
        }

        var quote = pricingService.quote(request.propertyId(), request.checkIn(), request.checkOut());
        long bookingId = bookingRepository.create(
                request.propertyId(),
                request.guestName().trim(),
                request.guestEmail().trim(),
                request.checkIn(),
                request.checkOut(),
                quote.total());
        return new BookingConfirmation(
                bookingId,
                request.propertyId(),
                request.checkIn(),
                request.checkOut(),
                quote.total(),
                quote.currency(),
                "CONFIRMED");
    }
}