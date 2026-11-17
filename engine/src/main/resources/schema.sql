CREATE TABLE IF NOT EXISTS districts (
  id BIGINT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS properties (
  id BIGINT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  district_id BIGINT NOT NULL,
  area VARCHAR(120) NOT NULL,
  image_key VARCHAR(16) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  rating DECIMAL(3, 2),
  property_type VARCHAR(80) NOT NULL,
  bedrooms SMALLINT NOT NULL,
  max_guests SMALLINT NOT NULL,
  status VARCHAR(16) NOT NULL,
  tag VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_property_district FOREIGN KEY (district_id) REFERENCES districts(id),
  CONSTRAINT chk_property_image CHECK (image_key IN ('villa', 'apartment', 'lodge')),
  CONSTRAINT chk_property_status CHECK (status IN ('AVAILABLE', 'UPCOMING')),
  CONSTRAINT chk_property_price CHECK (base_price >= 0),
  INDEX idx_property_district_status (district_id, status),
  INDEX idx_property_status_price (status, base_price)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  user_role VARCHAR(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_role CHECK (user_role IN ('GUEST', 'HOST', 'ADMIN'))
);

CREATE TABLE IF NOT EXISTS property_owners (
  property_id BIGINT PRIMARY KEY,
  host_user_id BIGINT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_owner_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_owner_user FOREIGN KEY (host_user_id) REFERENCES users(id),
  INDEX idx_property_owner_user (host_user_id, property_id)
);

CREATE TABLE IF NOT EXISTS property_rate_limits (
  property_id BIGINT PRIMARY KEY,
  minimum_rate DECIMAL(10, 2) NOT NULL,
  maximum_rate DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_rate_limit_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT chk_property_rate_limits CHECK (minimum_rate >= 0 AND maximum_rate >= minimum_rate)
);

CREATE TABLE IF NOT EXISTS cancellation_policies (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE,
  free_cancellation_hours SMALLINT UNSIGNED NOT NULL,
  cancellation_penalty_percent DECIMAL(5, 2) NOT NULL,
  CONSTRAINT chk_cancellation_penalty CHECK (cancellation_penalty_percent BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS property_cancellation_policies (
  property_id BIGINT PRIMARY KEY,
  cancellation_policy_id BIGINT NOT NULL,
  CONSTRAINT fk_policy_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_policy FOREIGN KEY (cancellation_policy_id) REFERENCES cancellation_policies(id)
);

CREATE TABLE IF NOT EXISTS price_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  effective_date DATE NOT NULL,
  base_rate DECIMAL(10, 2) NOT NULL,
  seasonal_multiplier DECIMAL(8, 4) NOT NULL,
  demand_multiplier DECIMAL(8, 4) NOT NULL,
  event_multiplier DECIMAL(8, 4) NOT NULL,
  unconstrained_rate DECIMAL(10, 2) NOT NULL,
  computed_rate DECIMAL(10, 2) NOT NULL,
  multiplier_applied DECIMAL(8, 4) NOT NULL,
  rate_limit_action VARCHAR(8) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_price_log_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT chk_price_log_rate CHECK (
    base_rate >= 0 AND unconstrained_rate >= 0 AND computed_rate >= 0 AND multiplier_applied > 0
  ),
  CONSTRAINT chk_price_log_limit CHECK (rate_limit_action IN ('NONE', 'FLOOR', 'CAP')),
  INDEX idx_price_log_property_date (property_id, effective_date, recorded_at),
  INDEX idx_price_log_recorded_at (recorded_at)
);

CREATE TABLE IF NOT EXISTS property_locations (
  property_id BIGINT PRIMARY KEY,
  latitude DECIMAL(9, 6) NOT NULL,
  longitude DECIMAL(9, 6) NOT NULL,
  CONSTRAINT fk_location_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT chk_location_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_location_longitude CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS pricing_factors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  factor_type VARCHAR(16) NOT NULL,
  multiplier DECIMAL(6, 3) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  CONSTRAINT fk_factor_property FOREIGN KEY (property_id) REFERENCES properties(id),
  CONSTRAINT chk_factor_type CHECK (factor_type IN ('SEASONAL', 'DEMAND')),
  CONSTRAINT chk_factor_range CHECK (multiplier > 0 AND ends_on >= starts_on),
  UNIQUE KEY uq_factor_window (property_id, factor_type, starts_on, ends_on),
  INDEX idx_factor_property_type_dates (property_id, factor_type, starts_on, ends_on)
);

CREATE TABLE IF NOT EXISTS pricing_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  district_id BIGINT NOT NULL,
  name VARCHAR(160) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  demand_multiplier DECIMAL(6, 3) NOT NULL,
  CONSTRAINT fk_event_district FOREIGN KEY (district_id) REFERENCES districts(id),
  CONSTRAINT chk_event_range CHECK (demand_multiplier > 0 AND ends_on >= starts_on),
  INDEX idx_event_district_dates (district_id, starts_on, ends_on)
);

CREATE TABLE IF NOT EXISTS price_log_events (
  price_log_id BIGINT NOT NULL,
  pricing_event_id BIGINT NOT NULL,
  applied_multiplier DECIMAL(8, 4) NOT NULL,
  PRIMARY KEY (price_log_id, pricing_event_id),
  CONSTRAINT fk_price_log_event_log FOREIGN KEY (price_log_id) REFERENCES price_logs(id) ON DELETE CASCADE,
  CONSTRAINT fk_price_log_event_event FOREIGN KEY (pricing_event_id) REFERENCES pricing_events(id),
  CONSTRAINT chk_price_log_event_multiplier CHECK (applied_multiplier > 0),
  INDEX idx_price_log_event_event (pricing_event_id, price_log_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  guest_user_id BIGINT,
  guest_name VARCHAR(120) NOT NULL,
  guest_email VARCHAR(254) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_property FOREIGN KEY (property_id) REFERENCES properties(id),
  CONSTRAINT fk_booking_guest FOREIGN KEY (guest_user_id) REFERENCES users(id),
  CONSTRAINT chk_booking_dates CHECK (check_out > check_in),
  CONSTRAINT chk_booking_status CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  INDEX idx_booking_property_dates (property_id, check_in, check_out),
  INDEX idx_booking_guest_status (guest_user_id, status),
  INDEX idx_booking_status_dates (status, check_in, check_out)
);

CREATE TABLE IF NOT EXISTS area_metrics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  district_id BIGINT NOT NULL,
  metric_name VARCHAR(24) NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  summary VARCHAR(240) NOT NULL,
  measured_on DATE NOT NULL,
  CONSTRAINT fk_metric_district FOREIGN KEY (district_id) REFERENCES districts(id),
  CONSTRAINT chk_metric_score CHECK (score >= 0 AND score <= 100),
  UNIQUE KEY uq_area_metric_snapshot (district_id, metric_name, measured_on),
  INDEX idx_area_metric_lookup (metric_name, measured_on, district_id)
);

INSERT IGNORE INTO districts (id, name) VALUES
  (1, 'Central'), (2, 'Chobe'), (3, 'Francistown'), (4, 'Gaborone'),
  (5, 'Ghanzi'), (6, 'Jwaneng'), (7, 'Kgalagadi'), (8, 'Kgatleng'),
  (9, 'Kweneng'), (10, 'Lobatse'), (11, 'North-East'), (12, 'North-West'),
  (13, 'Orapa'), (14, 'Selebi-Phikwe'), (15, 'Sowa'), (16, 'South-East'), (17, 'Southern');

INSERT IGNORE INTO properties
  (id, name, district_id, area, image_key, base_price, rating, property_type, bedrooms, max_guests, status, tag)
VALUES
  (1, 'The Acacia Residence', 4, 'Phakalane, Gaborone', 'villa', 1250, 4.98, 'Entire villa', 3, 6, 'AVAILABLE', 'Guest favourite'),
  (2, 'City Light Apartment', 4, 'CBD, Gaborone', 'apartment', 650, 4.92, 'Entire apartment', 2, 4, 'AVAILABLE', 'Great value'),
  (3, 'The Delta Hideaway', 12, 'Maun, North-West', 'lodge', 1800, 4.99, 'Private lodge', 2, 4, 'AVAILABLE', 'A little escape'),
  (4, 'Chobe Riverside Retreat', 2, 'Kasane, Chobe', 'lodge', 1450, NULL, 'Private lodge', 2, 4, 'UPCOMING', 'Coming November'),
  (5, 'Tati Urban Studio', 3, 'Tati River, Francistown', 'apartment', 550, NULL, 'Entire apartment', 1, 2, 'UPCOMING', 'Coming December'),
  (6, 'The Garden House', 1, 'Palapye, Central', 'villa', 850, 4.86, 'Entire house', 3, 6, 'AVAILABLE', 'Room to unwind');

INSERT IGNORE INTO users (id, full_name, email, password_hash, user_role) VALUES
  (1, 'Illustrative Host One', 'host-one@example.test', '!disabled-seed-account!', 'HOST'),
  (2, 'Illustrative Host Two', 'host-two@example.test', '!disabled-seed-account!', 'HOST'),
  (3, 'Illustrative Administrator', 'admin@example.test', '!disabled-seed-account!', 'ADMIN');

INSERT IGNORE INTO property_owners (property_id, host_user_id) VALUES
  (1, 1), (2, 1), (3, 1), (4, 2), (5, 2), (6, 2);

INSERT IGNORE INTO property_rate_limits (property_id, minimum_rate, maximum_rate) VALUES
  (1, 750, 2000), (2, 400, 1000), (3, 1000, 2500),
  (4, 800, 2200), (5, 300, 900), (6, 500, 1400);

INSERT IGNORE INTO cancellation_policies (id, name, free_cancellation_hours, cancellation_penalty_percent) VALUES
  (1, 'Illustrative flexible policy', 48, 0),
  (2, 'Illustrative moderate policy', 168, 50);

INSERT IGNORE INTO property_cancellation_policies (property_id, cancellation_policy_id) VALUES
  (1, 1), (2, 1), (3, 2), (4, 2), (5, 1), (6, 1);

INSERT IGNORE INTO property_locations (property_id, latitude, longitude) VALUES
  (1, -24.628200, 25.923100),
  (2, -24.658000, 25.908600),
  (3, -19.983300, 23.416700),
  (4, -17.800000, 25.150000),
  (5, -21.170000, 27.500000),
  (6, -22.546000, 27.125000);

INSERT IGNORE INTO pricing_factors (property_id, factor_type, multiplier, starts_on, ends_on) VALUES
  (1, 'SEASONAL', 1.080, '2026-11-01', '2027-01-31'),
  (3, 'DEMAND', 1.100, '2026-11-01', '2027-02-28');

INSERT INTO pricing_events (district_id, name, starts_on, ends_on, demand_multiplier)
SELECT 2, 'Illustrative Chobe peak-season event', '2026-12-01', '2027-01-15', 1.150
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_events WHERE district_id = 2 AND name = 'Illustrative Chobe peak-season event'
);

INSERT IGNORE INTO area_metrics (district_id, metric_name, score, summary, measured_on) VALUES
  (4, 'ACTIVITY', 82, 'Illustrative visitor activity index', '2026-10-01'),
  (12, 'ACTIVITY', 76, 'Illustrative visitor activity index', '2026-10-01'),
  (1, 'ACTIVITY', 79, 'Illustrative visitor activity index', '2026-10-01'),
  (4, 'SAFETY', 84, 'Illustrative neighbourhood index; not verified safety data', '2026-10-01'),
  (12, 'SAFETY', 78, 'Illustrative neighbourhood index; not verified safety data', '2026-10-01'),
  (1, 'SAFETY', 80, 'Illustrative neighbourhood index; not verified safety data', '2026-10-01'),
  (4, 'AMENITIES', 94, 'Illustrative local amenities index', '2026-10-01'),
  (12, 'AMENITIES', 68, 'Illustrative local amenities index', '2026-10-01'),
  (1, 'AMENITIES', 75, 'Illustrative local amenities index', '2026-10-01');