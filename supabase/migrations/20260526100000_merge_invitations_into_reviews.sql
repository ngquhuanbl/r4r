-- Merge review_invitations into reviews; drop invitation_statuses.

ALTER TABLE public.reviews
  ADD COLUMN connection_id INTEGER REFERENCES public.connections(id) ON DELETE CASCADE,
  ADD COLUMN platform_id INTEGER REFERENCES public.platforms(id),
  ADD COLUMN reviewed_business_id INTEGER REFERENCES public.businesses(id) ON DELETE CASCADE,
  ADD COLUMN reviewed_owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN reviewer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN reviewer_business_id INTEGER REFERENCES public.businesses(id) ON DELETE SET NULL;

UPDATE public.reviews r
SET
  connection_id = ri.connection_id,
  platform_id = ri.platform_id,
  reviewed_business_id = ri.business_id,
  reviewed_owner_user_id = ri.inviter_id,
  reviewer_user_id = ri.invitee_id,
  reviewer_business_id = ri.invitee_business_id
FROM public.review_invitations ri
WHERE r.invitation_id = ri.id
  AND ri.connection_id IS NOT NULL;

DELETE FROM public.reviews
WHERE invitation_id IN (
  SELECT id FROM public.review_invitations WHERE connection_id IS NULL
);

DELETE FROM public.review_invitations;

ALTER TABLE public.reviews
  ALTER COLUMN connection_id SET NOT NULL,
  ALTER COLUMN platform_id SET NOT NULL,
  ALTER COLUMN reviewed_business_id SET NOT NULL,
  ALTER COLUMN reviewed_owner_user_id SET NOT NULL,
  ALTER COLUMN reviewer_user_id SET NOT NULL;

ALTER TABLE public.reviews DROP COLUMN invitation_id;

DROP TRIGGER IF EXISTS set_review_invitations_updated_at ON public.review_invitations;
DROP TABLE public.review_invitations;
DROP TABLE public.invitation_statuses;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_connection_reviewed_business_unique
    UNIQUE (connection_id, reviewed_business_id),
  ADD CONSTRAINT reviews_reviewed_ne_reviewer_business
    CHECK (reviewed_business_id <> reviewer_business_id);

CREATE INDEX reviews_connection_id_idx ON public.reviews (connection_id);
CREATE INDEX reviews_reviewer_user_id_idx ON public.reviews (reviewer_user_id);
CREATE INDEX reviews_reviewed_owner_user_id_idx ON public.reviews (reviewed_owner_user_id);
CREATE INDEX reviews_reviewer_business_id_idx ON public.reviews (reviewer_business_id)
  WHERE reviewer_business_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.delete_user_account_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.reviews
  WHERE reviewer_user_id = target_user_id
     OR reviewed_owner_user_id = target_user_id
     OR reviewed_business_id IN (
       SELECT id FROM public.businesses WHERE user_id = target_user_id
     );

  DELETE FROM public.connections
  WHERE business_a_id IN (SELECT id FROM public.businesses WHERE user_id = target_user_id)
     OR business_b_id IN (SELECT id FROM public.businesses WHERE user_id = target_user_id);

  DELETE FROM public.business_platforms
  WHERE business_id IN (SELECT id FROM public.businesses WHERE user_id = target_user_id);

  DELETE FROM public.businesses WHERE user_id = target_user_id;

  DELETE FROM public.user_preferences WHERE user_id = target_user_id;
END;
$$;
