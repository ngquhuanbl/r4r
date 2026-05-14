-- Per-business slot release: after outgoing submit, that location stops counting this
-- connection toward its slot limit without waiting for the partner's draft/submit.
-- When both sides have released, the row is marked completed (same as terminal-verify path).
ALTER TABLE public.connections
  ADD COLUMN IF NOT EXISTS business_a_slot_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_b_slot_released_at TIMESTAMPTZ;
