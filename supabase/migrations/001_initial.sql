-- BBM Bowling Bar Malacky - Database Schema

-- Resources (bowling lanes, billiard tables, darts boards)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('bowling', 'billiard', 'darts')),
  number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed resources
INSERT INTO resources (name, type, number) VALUES
  ('Dráha 1', 'bowling', 1),
  ('Dráha 2', 'bowling', 2),
  ('Dráha 3', 'bowling', 3),
  ('Dráha 4', 'bowling', 4),
  ('Biliard 1', 'billiard', 1),
  ('Biliard 2', 'billiard', 2),
  ('Biliard 3', 'billiard', 3),
  ('Biliard 4', 'billiard', 4),
  ('Šípky 1', 'darts', 1),
  ('Šípky 2', 'darts', 2),
  ('Šípky 3', 'darts', 3),
  ('Šípky 4', 'darts', 4);

-- Pricing rules
-- days_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
-- time_end '00:00' means midnight (24:00), '02:00' means 02:00 next day (26:00)
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR NOT NULL CHECK (resource_type IN ('bowling', 'billiard', 'darts')),
  days_of_week INTEGER[] NOT NULL,
  start_hour INTEGER NOT NULL,  -- 0-23
  end_hour INTEGER NOT NULL,    -- 0-26 (allows cross-midnight, 24=midnight, 25=1am, 26=2am)
  price_per_hour DECIMAL(10,2),
  tier VARCHAR NOT NULL CHECK (tier IN ('cheap', 'medium', 'peak', 'closed')),
  color VARCHAR NOT NULL,
  label VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bowling pricing rules
-- Monday-Thursday (1-4): 14-16 cheap, 16-18 medium, 18-24 peak
INSERT INTO pricing_rules (resource_type, days_of_week, start_hour, end_hour, price_per_hour, tier, color, label) VALUES
  ('bowling', ARRAY[1,2,3,4], 14, 16, 12.90, 'cheap',  '#F59E0B', '12,90 €'),
  ('bowling', ARRAY[1,2,3,4], 16, 18, 18.90, 'medium', '#22C55E', '18,90 €'),
  ('bowling', ARRAY[1,2,3,4], 18, 24, 24.90, 'peak',   '#3B82F6', '24,90 €');

-- Friday (5): 13-16 cheap, 16-18 medium, 18-26 peak (02:00)
INSERT INTO pricing_rules (resource_type, days_of_week, start_hour, end_hour, price_per_hour, tier, color, label) VALUES
  ('bowling', ARRAY[5], 13, 16, 12.90, 'cheap',  '#F59E0B', '12,90 €'),
  ('bowling', ARRAY[5], 16, 18, 18.90, 'medium', '#22C55E', '18,90 €'),
  ('bowling', ARRAY[5], 18, 26, 24.90, 'peak',   '#3B82F6', '24,90 €');

-- Saturday (6): 13-16 medium, 16-26 peak (02:00)
INSERT INTO pricing_rules (resource_type, days_of_week, start_hour, end_hour, price_per_hour, tier, color, label) VALUES
  ('bowling', ARRAY[6], 13, 16, 18.90, 'medium', '#22C55E', '18,90 €'),
  ('bowling', ARRAY[6], 16, 26, 24.90, 'peak',   '#3B82F6', '24,90 €');

-- Sunday (0): 13-16 medium, 16-22 peak, closed after 22
INSERT INTO pricing_rules (resource_type, days_of_week, start_hour, end_hour, price_per_hour, tier, color, label) VALUES
  ('bowling', ARRAY[0], 13, 16, 18.90, 'medium', '#22C55E', '18,90 €'),
  ('bowling', ARRAY[0], 16, 22, 24.90, 'peak',   '#3B82F6', '24,90 €');

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id),
  customer_name VARCHAR NOT NULL,
  customer_email VARCHAR NOT NULL,
  customer_phone VARCHAR NOT NULL,
  date DATE NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  duration_hours INTEGER NOT NULL,
  total_price DECIMAL(10,2),
  status VARCHAR DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Closures (admin blocks time ranges)
CREATE TABLE closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id),
  date DATE NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE closures ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "resources_public_read" ON resources FOR SELECT USING (true);
CREATE POLICY "pricing_rules_public_read" ON pricing_rules FOR SELECT USING (true);
CREATE POLICY "reservations_public_insert" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_public_read" ON reservations FOR SELECT USING (true);
CREATE POLICY "closures_public_read" ON closures FOR SELECT USING (true);

-- Admin full access (authenticated users)
CREATE POLICY "reservations_admin_update" ON reservations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "closures_admin_all" ON closures FOR ALL USING (auth.role() = 'authenticated');
