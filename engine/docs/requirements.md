# Requirements Catalogue

This catalogue translates the project brief into a traceable implementation scope. `Implemented` means a working engine path exists. `Foundation` means the schema or partial flow exists but the user-facing/security workflow is incomplete. `Planned` means it is not implemented. Seed records and area scores remain illustrative.

## Functional requirements

| ID | Requirement | Status | Module / evidence |
| --- | --- | --- | --- |
| FR-01 | Register a guest, host, or administrator account | Foundation | `users` table; registration flow and password hashing are not implemented |
| FR-02 | Authenticate accounts and manage sessions | Planned | Requires account authentication and session/token design |
| FR-03 | Enforce guest, host, and administrator roles | Foundation | Role values stored in `users`; current write routes use one trusted service API key |
| FR-04 | Create a property listing | Planned | Property read model exists; host CRUD is not implemented |
| FR-05 | Edit a property listing | Planned | Host CRUD is not implemented |
| FR-06 | Delete or archive a property listing | Planned | Host CRUD and archive policy are not implemented |
| FR-07 | Assign each property to its host | Foundation | Normalized `property_owners` relation and illustrative seed ownership |
| FR-08 | Browse properties by Botswana district | Implemented | Public property endpoint and frontend district filter |
| FR-09 | Search properties by text | Foundation | Frontend filters the current result set; server-side indexed text search is not implemented |
| FR-10 | Filter availability for requested dates | Planned | Quote accepts dates; property availability search is not implemented |
| FR-11 | Sort and filter listings by price | Implemented | Frontend sorts and filters current engine prices |
| FR-12 | Enforce host minimum and maximum rates | Implemented | `property_rate_limits`; `DynamicPricingEngine` clamps each nightly rate |
| FR-13 | Apply seasonal and demand pricing factors | Implemented | Date-window `pricing_factors` and `DynamicPricingEngine` |
| FR-14 | Apply local event demand multipliers | Implemented | District/date-indexed `pricing_events` |
| FR-15 | Include lead time and historical occupancy in pricing | Planned | No trained model or occupancy feature is available yet |
| FR-16 | Return date-specific nightly quotes and totals | Implemented | `GET /api/v1/pricing/quote` |
| FR-17 | Cache repeated nightly price calculations | Implemented | Bounded five-minute Caffeine cache |
| FR-18 | Create a booking using the quoted total | Foundation | Transactional booking endpoint exists; identity and guest authorization are not production-ready |
| FR-19 | Prevent overlapping confirmed bookings | Implemented | Property row lock plus indexed overlap query in one transaction |
| FR-20 | Cancel bookings under host cancellation policies | Foundation | Policy schema exists; cancellation workflow and enforcement are not implemented |
| FR-21 | Record price decisions with timestamps and input factors | Implemented | `price_logs` and `price_log_events` preserve the uncapped rate, multipliers, cap action, and active events |
| FR-22 | Show district activity, safety, and amenity indicators | Foundation | Analytics API and frontend are wired; scores are illustrative, not verified |
| FR-23 | Show routed distance and travel duration to a property | Implemented | Optional protected OpenRouteService adapter; requires an engine-side provider key |
| FR-24 | Recommend a property from guest preferences | Planned | Current questionnaire result is an illustrative frontend preview |
| FR-25 | Create and maintain local demand events | Foundation | Event data and pricing lookup exist; authenticated admin CRUD is not implemented |
| FR-26 | Persist user booking history | Foundation | Optional guest FK and booking snapshots exist; account-backed history is not implemented |
| FR-27 | Review live pricing inputs and recent calculation decisions | Implemented | `/engine` dashboard, date-specific decision traces, and recent audit history |

## Reporting requirements

The brief asks for at least five reporting or graphical features. These are tracked separately from functional requirements.

| ID | Report or visualization | Status | Evidence / next step |
| --- | --- | --- | --- |
| RP-01 | Export property inventory | Implemented | Protected CSV endpoint |
| RP-02 | Export bookings without guest email | Implemented | Protected CSV endpoint; PII omitted |
| RP-03 | Historical revenue by month | Planned | Needs a reporting query and chart UI |
| RP-04 | Compare base-price yield with dynamic-price yield | Planned | Needs price and booking attribution analysis |
| RP-05 | Seasonal booking and occupancy trends | Planned | Needs date-bucketed booking analytics and chart UI |
| RP-06 | Local event impact on demand and revenue | Planned | Needs event-linked booking/reporting data |
| RP-07 | Price history by property | Implemented | Dashboard shows a rate chart and auditable recent decision table |

## System tiers

| Tier | Current structure | Responsibility |
| --- | --- | --- |
| Presentation | Root React/TanStack frontend in `src/` | Home, listings, settings, insights, and pricing decision dashboard; public HTTP reads through `src/lib/markham-api.ts` |
| Business | Spring Boot controllers and domain services in `engine/src/main/java/bw/markham/engine/` | Pricing, booking, property, analytics, routing, reporting, and API-key boundary |
| Data | MySQL schema and seed data in `engine/src/main/resources/schema.sql` | Normalized relations, constraints, and indexed lookups |

The brief names Swing, JavaFX, or WinForms for a standalone desktop presentation. This repository keeps the existing React frontend, as previously selected; it is a web presentation tier, not a desktop client. Replacing it with a desktop UI would be a separate product decision.