-- Run this in Supabase SQL Editor

CREATE TABLE blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('manual', 'automatic')),
  category    text NOT NULL,
  max_uses    integer NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE cycles (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  position integer NOT NULL
);

CREATE TABLE cycle_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id   uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  image_path text,
  position   integer NOT NULL
);

-- uses_per_cycle: one integer per cycle (0-based index)
-- Each slot resets to 0 only when that cycle is next entered (arrival reset).
CREATE TABLE block_state (
  block_id          uuid PRIMARY KEY REFERENCES blocks(id) ON DELETE CASCADE,
  current_cycle_idx integer NOT NULL DEFAULT 0,
  uses_per_cycle    integer[] NOT NULL DEFAULT '{}',
  last_action_date  date
);

CREATE TABLE reminders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  category     text NOT NULL,
  cadence_days integer NOT NULL,
  starts_at    date NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE reminder_state (
  reminder_id uuid PRIMARY KEY REFERENCES reminders(id) ON DELETE CASCADE,
  next_due_at date NOT NULL
);
