-- Migration: Add task assignments, comments, attachments, audit logs
CREATE TABLE IF NOT EXISTS task_assignments (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL,
  helper_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_attachments (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_audit_logs (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
