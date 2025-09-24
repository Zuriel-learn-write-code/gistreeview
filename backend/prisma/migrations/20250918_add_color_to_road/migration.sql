-- Add optional color column to road to allow frontend styling and editing
ALTER TABLE IF EXISTS "road" ADD COLUMN IF NOT EXISTS color VARCHAR(50);
