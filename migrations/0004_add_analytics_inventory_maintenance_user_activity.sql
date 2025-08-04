-- Migration: Add analytics, inventory usage/restock, maintenance, user activity, notifications
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  property_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_usage (
  id SERIAL PRIMARY KEY,
  item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  used_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_restock_requests (
  id SERIAL PRIMARY KEY,
  item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  requested_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id SERIAL PRIMARY KEY,
  maintenance_id UUID NOT NULL,
  user_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  notes TEXT,
  scheduled_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id SERIAL PRIMARY KEY,
  maintenance_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notes TEXT,
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  meta JSONB,
  sent_at TIMESTAMP DEFAULT NOW()
);
