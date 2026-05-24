-- First-class pairing between two businesses (see docs/connections.md).
CREATE TABLE public.connections (
  id SERIAL PRIMARY KEY,
  business_a_id INTEGER NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  business_b_id INTEGER NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  initiator_business_id INTEGER NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT connections_ordered_pair CHECK (business_a_id < business_b_id)
);

CREATE INDEX connections_business_a_active_idx ON public.connections (business_a_id)
  WHERE status = 'active';
CREATE INDEX connections_business_b_active_idx ON public.connections (business_b_id)
  WHERE status = 'active';

COMMENT ON TABLE public.connections IS 'Temporary pairing between two businesses for review exchange; slot released when status=completed.';

ALTER TABLE public.review_invitations
  ADD COLUMN connection_id INTEGER REFERENCES public.connections (id) ON DELETE SET NULL;

CREATE INDEX review_invitations_connection_id_idx ON public.review_invitations (connection_id)
  WHERE connection_id IS NOT NULL;
