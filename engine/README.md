# MarKHaM Engine

Java 21 / Spring Boot REST service and MySQL 8.4 schema for the MarKHaM frontend. The engine is a sibling project inside this repository; the browser talks to its HTTP API and never connects directly to the database.

## Run locally

Docker Compose is the easiest way to start the API and database together:

```sh
cp .env.example .env
docker compose --env-file .env up --build
```

The API listens on `http://localhost:8081`. MySQL schema and clearly illustrative sample records are initialized on startup. The credentials in `.env.example` are for local development only; replace them before deploying anywhere shared or public.

To run the Java tests without containers, install Java 21 and Maven, then run:

```sh
mvn test
```

For a local API-only dashboard demo without installing MySQL, start the engine with its explicitly non-production H2 profile:

```sh
mvn -f engine/pom.xml \
  -Dspring-boot.run.profiles=local-demo \
  org.springframework.boot:spring-boot-maven-plugin:3.5.3:run
```

This uses the same MySQL-compatible schema and illustrative seed records in an in-memory database; data is discarded when the process stops. Normal startup and Docker Compose continue to use MySQL.

## API

All JSON responses use BWP for prices. Property images use `imageKey` values that map to bundled frontend assets.

| Method | Path | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | Health check | Public |
| `GET` | `/api/v1/districts` | Botswana districts | Public |
| `GET` | `/api/v1/properties?status=ALL&district=Gaborone` | Search properties; status may be `ALL`, `AVAILABLE`, or `UPCOMING` | Public |
| `GET` | `/api/v1/pricing/quote?propertyId=1&checkIn=2026-11-10&checkOut=2026-11-13` | Date-specific nightly quote | Public |
| `GET` | `/api/v1/pricing/decisions?limit=25` | Recent auditable pricing decisions | Public; operational demo data |
| `GET` | `/api/v1/analytics/areas?metric=ACTIVITY` | Area activity, safety, or amenities scores | Public; illustrative data |
| `POST` | `/api/v1/routing/properties/{propertyId}/route` | Route from a supplied origin to a property's stored coordinates | Bearer API key; OpenRouteService optional |
| `POST` | `/api/v1/bookings` | Create a confirmed booking | Bearer API key |
| `GET` | `/api/v1/reports/properties.csv` | Property report | Bearer API key |
| `GET` | `/api/v1/reports/bookings.csv` | Booking report without guest email | Bearer API key |

Example property response:

```json
{
  "id": 1,
  "name": "The Acacia Residence",
  "district": "Gaborone",
  "area": "Phakalane, Gaborone",
  "imageKey": "villa",
  "price": 1250,
  "rating": 4.98,
  "type": "Entire villa",
  "beds": 3,
  "guests": 6,
  "status": "AVAILABLE",
  "tag": "Guest favourite"
}
```

Each quote night includes a `decision` object containing base rate, seasonal/demand/event multipliers, active event names, uncapped rate, configured floor/cap, and final rate. `rateLimitAction` is `NONE`, `FLOOR`, or `CAP`. The decision history endpoint returns those inputs with the calculation timestamp. The React operator view is available at `/engine` when the frontend is running.

Protected calls use `Authorization: Bearer <MARKHAM_API_KEY>`. This shared key is intended only for trusted server-to-server calls; do not put it in `VITE_*` variables or browser code. Production booking flows need user authentication and a server-side authorization boundary before they are exposed to browsers.

Routing uses OpenRouteService's Directions API through a backend adapter. Set `MARKHAM_ORS_API_KEY` in the engine environment to enable it; leave it blank to keep the rest of the engine available without routing. Requests use the configured driving-car Directions endpoint and return `distanceMeters` and `durationSeconds`. The routing endpoint is protected because the provider key and usage quota must not be exposed through the static frontend. Seed listing coordinates are illustrative; replace them with verified coordinates before relying on travel estimates.

Example routing request from a trusted backend:

```sh
curl -X POST http://localhost:8081/api/v1/routing/properties/1/route \
  -H 'Authorization: Bearer local-dev-change-me' \
  -H 'Content-Type: application/json' \
  -d '{"originLatitude":-24.65,"originLongitude":25.91}'
```

The frontend reads `VITE_ENGINE_API_URL`, defaulting to `http://localhost:8081/api/v1`. Set it to the API's public base URL in the frontend deployment environment. CORS is restricted by `MARKHAM_FRONTEND_ORIGIN` (defaults to the local Vite origin `http://localhost:5173`).

## Data and pricing notes

`schema.sql` separates districts, properties, property locations, pricing factors, pricing events, bookings, and area metrics. It includes indexes for district/status property lookup, property/date booking overlap checks, event district/date matching, dated analytics lookup, and per-property decision history. `price_logs` stores every input and recalculation result; `price_log_events` links the exact events that affected a decision. A bounded Caffeine cache stores per-property nightly decisions for five minutes.

The seeded listings, events, prices, and all neighbourhood scores are demonstration data, not verified market, availability, safety, or amenity information. Replace them with approved sources before using this system for real decisions. See [the architecture and ERD](docs/architecture.md).

The current package structure separates the React presentation tier, the REST API adapters in `api/`, cross-cutting configuration/security, and business modules (`analytics`, `booking`, `pricing`, `property`, `report`, `routing`). JDBC repositories remain beside their owning domain modules; the database tier is in `src/main/resources/schema.sql`. Requirement completion and deferred scope are tracked in [the requirements catalogue](docs/requirements.md).