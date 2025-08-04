-- Migration: Add booking notes, attachments, audit logs
CREATE TABLE IF NOT EXISTS booking_notes (
  id SERIAL PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_attachments (
  id SERIAL PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_audit_logs (
  id SERIAL PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
