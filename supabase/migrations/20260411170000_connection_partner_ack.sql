-- Partner-side acknowledgement when another business initiates a match (toast once).
ALTER TABLE public.connections
  ADD COLUMN IF NOT EXISTS partner_acknowledged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS connections_partner_unack_idx
  ON public.connections (business_a_id, business_b_id)
  WHERE partner_acknowledged_at IS NULL AND status = 'active';
