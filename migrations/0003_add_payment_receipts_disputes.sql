-- Migration: Add payment receipts and disputes
CREATE TABLE IF NOT EXISTS payment_receipts (
  id SERIAL PRIMARY KEY,
  payment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_disputes (
  id SERIAL PRIMARY KEY,
  payment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
