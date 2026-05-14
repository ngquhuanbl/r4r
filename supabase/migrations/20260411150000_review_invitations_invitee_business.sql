-- Owned business context for the invitee (enables per-business outgoing review action counts).
ALTER TABLE public.review_invitations
  ADD COLUMN invitee_business_id integer REFERENCES public.businesses (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.review_invitations.invitee_business_id IS
  'Optional: which of the invitee''s businesses this invitation is attributed to (set by app when known; used for dashboard outgoing DRAFT counts per location).';

CREATE INDEX review_invitations_invitee_business_id_idx
  ON public.review_invitations (invitee_business_id)
  WHERE invitee_business_id IS NOT NULL;
