-- Add confirmation/cancel tokens and pending status to reservations

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled'));

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancel_token TEXT UNIQUE;
