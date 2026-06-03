-- Run this once in Supabase SQL Editor to add the enabled column to existing databases
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
