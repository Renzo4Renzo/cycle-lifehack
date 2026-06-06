-- Run this in Supabase SQL Editor

CREATE TABLE settings (
  id                  integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  schedule_tz_offset  integer NOT NULL DEFAULT -300
);

-- Seed with UTC-5 (Lima, Peru)
INSERT INTO settings (id, schedule_tz_offset) VALUES (1, -300);
