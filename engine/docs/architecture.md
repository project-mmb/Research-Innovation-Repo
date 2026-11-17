# Engine Architecture

## Components

```mermaid
flowchart LR
    Browser[React frontend]
    API[REST controllers in api package]
    Auth[EngineSecurityManager and API key filter]
    Property[PropertyService]
    Pricing[DynamicPricingEngine]
    Booking[BookingService]
    Analytics[AnalyticsEngine]
    Reports[ReportGenerator]
    Routing[RoutingService]
    ORS[OpenRouteService adapter]
    Cache[Caffeine nightly price cache]
    PriceLog[PriceLogRepository]
    DB[(MySQL 8.4)]

    Browser -->|Public reads| API
    API --> Auth
    API --> Property
    API --> Pricing
    API --> Booking
    API --> Analytics
    API --> Reports
    API --> Routing
    Routing --> ORS
    Property --> Pricing
    Booking --> Pricing
    Pricing --> Cache
    Pricing --> PriceLog
    Property --> DB
    Pricing --> DB
    PriceLog --> DB
    Booking --> DB
    Analytics --> DB
    Reports --> DB
    Routing --> DB
```

The web frontend consumes the public property API. The database and shared server API key stay on the backend. Booking and report routes require a bearer key and must be called by a trusted server, not directly by browser code.

## Service class model

```mermaid
classDiagram
        class PropertyService
        class PropertyRepository
        class PropertyRecord
        class PropertiesController
        class DynamicPricingEngine
        class PricingDecision
        class PricingQuote
        class NightlyRate
        class PricingFactorRepository
        class PriceLogRepository
        class BookingService
        class BookingController
        class AnalyticsEngine
        class RoutingService
        class RoutingController
        class RouteProvider {
            <<interface>>
            +isConfigured() boolean
            +route(origin, destination) RouteMetrics
        }
        class OpenRouteServiceClient
        class RouteMetrics
        class MySQL

        PropertiesController --> PropertyService
        PropertyService --> PropertyRepository
        PropertyService --> DynamicPricingEngine
        PropertyRepository --> PropertyRecord
        DynamicPricingEngine --> PricingFactorRepository
        DynamicPricingEngine --> PriceLogRepository
        DynamicPricingEngine --> PricingDecision
        PricingQuote o-- NightlyRate
        NightlyRate --> PricingDecision
        BookingController --> BookingService
        BookingService --> DynamicPricingEngine
        AnalyticsEngine --> MySQL
        PropertyRepository --> MySQL
        PricingFactorRepository --> MySQL
        PriceLogRepository --> MySQL
        RoutingController --> RoutingService
        RoutingService --> PropertyRepository
        RoutingService --> RouteProvider
        OpenRouteServiceClient ..|> RouteProvider
        OpenRouteServiceClient --> RouteMetrics
```

Controllers form the HTTP presentation boundary; service classes own business rules; repositories use JDBC for MySQL access. The routing provider interface keeps the rest of the engine independent of OpenRouteService and allows a different routing implementation to be substituted later.

## Source layout

```text
src/                                      React presentation tier
    routes/                                 Home, listings, settings, insights, engine dashboard
    lib/markham-api.ts                      Browser-safe public API client
engine/src/main/java/bw/markham/engine/
    api/                                    REST controllers and API errors
    analytics/, booking/, pricing/          Business services and domain types
    property/, report/, routing/            Business services and JDBC repositories
    config/, security/                      Cross-cutting engine concerns
engine/src/main/resources/schema.sql      MySQL data tier, constraints, indexes, seed data
engine/docs/                              ERD, UML and requirements traceability
src/routes/engine.tsx                     Operator dashboard for live traces and recent decisions
```

## Entity relationships

```mermaid
erDiagram
    DISTRICTS ||--o{ PROPERTIES : contains
    DISTRICTS ||--o{ PRICING_EVENTS : hosts
    DISTRICTS ||--o{ AREA_METRICS : measures
    PROPERTIES ||--o{ PRICING_FACTORS : adjusts
    PROPERTIES ||--o{ BOOKINGS : receives
    PROPERTIES ||--o| PROPERTY_LOCATIONS : located_at
    PROPERTIES ||--o| PROPERTY_OWNERS : owned_by
    PROPERTIES ||--o| PROPERTY_RATE_LIMITS : constrained_by
    PROPERTIES ||--o| PROPERTY_CANCELLATION_POLICIES : uses
    USERS ||--o{ PROPERTY_OWNERS : owns
    USERS ||--o{ BOOKINGS : places
    CANCELLATION_POLICIES ||--o{ PROPERTY_CANCELLATION_POLICIES : assigned_to
    PROPERTIES ||--o{ PRICE_LOGS : records
    PRICE_LOGS ||--o{ PRICE_LOG_EVENTS : includes
    PRICING_EVENTS ||--o{ PRICE_LOG_EVENTS : contributed_to

    DISTRICTS {
        bigint id PK
        varchar name UK
    }
    PROPERTIES {
        bigint id PK
        bigint district_id FK
        varchar name
        varchar area
        decimal base_price
        varchar status
    }
    USERS {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        varchar user_role
    }
    PROPERTY_OWNERS {
        bigint property_id PK, FK
        bigint host_user_id FK
    }
    PROPERTY_RATE_LIMITS {
        bigint property_id PK, FK
        decimal minimum_rate
        decimal maximum_rate
    }
    CANCELLATION_POLICIES {
        bigint id PK
        varchar name UK
        smallint free_cancellation_hours
        decimal cancellation_penalty_percent
    }
    PROPERTY_CANCELLATION_POLICIES {
        bigint property_id PK, FK
        bigint cancellation_policy_id FK
    }
    PROPERTY_LOCATIONS {
        bigint property_id PK, FK
        decimal latitude
        decimal longitude
    }
    PRICING_FACTORS {
        bigint id PK
        bigint property_id FK
        varchar factor_type
        decimal multiplier
        date starts_on
        date ends_on
    }
    PRICING_EVENTS {
        bigint id PK
        bigint district_id FK
        varchar name
        date starts_on
        date ends_on
        decimal demand_multiplier
    }
    BOOKINGS {
        bigint id PK
        bigint property_id FK
        bigint guest_user_id FK
        varchar guest_name
        varchar guest_email
        date check_in
        date check_out
        decimal total_price
        varchar status
    }
    PRICE_LOGS {
        bigint id PK
        bigint property_id FK
        date effective_date
        decimal base_rate
        decimal seasonal_multiplier
        decimal demand_multiplier
        decimal event_multiplier
        decimal unconstrained_rate
        decimal computed_rate
        varchar rate_limit_action
        timestamp recorded_at
    }
    PRICE_LOG_EVENTS {
        bigint price_log_id PK, FK
        bigint pricing_event_id PK, FK
        decimal applied_multiplier
    }
    AREA_METRICS {
        bigint id PK
        bigint district_id FK
        varchar metric_name
        decimal score
        date measured_on
    }
```

`total_price` is a booking-time snapshot; it does not depend on later pricing-factor changes. Booking creation locks the property row, checks date overlap, calculates the quote, and inserts within one transaction.

## Use cases

```mermaid
flowchart LR
    Guest[Guest]
    Operator[Trusted operator service]
    Analyst[Pricing analyst]
    Browse((Browse and filter properties))
    Quote((Request a dated price quote))
    Insights((View illustrative area insights))
    Book((Create a booking))
    Export((Export CSV reports))
    Review((Review pricing decision trace))

    Guest --> Browse
    Guest --> Quote
    Guest --> Insights
    Operator --> Book
    Operator --> Export
    Analyst --> Review
```

Public use cases are read-only. Booking, report delivery, user identity, property administration, payment, and cancellation workflows require production authentication and authorization design before deployment.

The optional OpenRouteService adapter accepts an origin coordinate from a trusted caller and joins it to the property's stored destination coordinate. It returns routed distance and travel duration; the API key remains in engine configuration and is never sent to the browser. Seed coordinates are illustrative and must be replaced with verified property coordinates.