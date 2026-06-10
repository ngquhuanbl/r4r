-- Create platforms table first (no foreign keys)
CREATE TABLE IF NOT EXISTS public.platforms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert default platforms with color information
INSERT INTO public.platforms (name, color) VALUES
  ('Yelp', 'bg-green-500 hover:bg-green-600'),
  ('Google', 'bg-blue-500 hover:bg-blue-600'),
  ('TripAdvisor', 'bg-yellow-500 hover:bg-yellow-600')
ON CONFLICT DO NOTHING;

-- Create trigger function that will be used by multiple tables
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create trigger for businesses table
DROP TRIGGER IF EXISTS set_businesses_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

-- Create business_platforms junction table
CREATE TABLE IF NOT EXISTS public.business_platforms (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform_id INTEGER NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
  platform_url TEXT,
  platform_business_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(business_id, platform_id)
);

-- Create trigger for business_platforms table
DROP TRIGGER IF EXISTS set_business_platforms_updated_at ON public.business_platforms;
CREATE TRIGGER set_business_platforms_updated_at
BEFORE UPDATE ON public.business_platforms
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();
-- Review statuses
CREATE TABLE IF NOT EXISTS public.review_statuses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

-- Insert review statuses
INSERT INTO public.review_statuses (name, description) VALUES
  ('DRAFT', 'Review is being drafted'),
  ('SUBMITTED', 'Review has been submitted, awaiting verification'),
  ('VERIFIED', 'Review has been verified by the business owner'),
  ('REJECTED', 'Review has been rejected by the business owner')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS public.connections (
  id SERIAL PRIMARY KEY,
  business_a_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_b_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  initiator_business_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT connections_ordered_pair CHECK (business_a_id < business_b_id),
  CONSTRAINT connections_business_pair_unique UNIQUE (business_a_id, business_b_id)
);

-- Connection-backed reviews (two per active connection)
CREATE TABLE IF NOT EXISTS public.reviews (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  platform_id INTEGER NOT NULL REFERENCES public.platforms(id),
  reviewed_business_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reviewed_owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_business_id INTEGER REFERENCES public.businesses(id) ON DELETE SET NULL,
  content TEXT,
  url TEXT,
  status_id INTEGER NOT NULL REFERENCES public.review_statuses(id),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT reviews_connection_reviewed_business_unique UNIQUE (connection_id, reviewed_business_id),
  CONSTRAINT reviews_reviewed_ne_reviewer_business CHECK (reviewed_business_id <> reviewer_business_id)
);

-- User account/product preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_new_connection BOOLEAN NOT NULL DEFAULT true,
  notify_weekly_summary BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Stripe billing cache (user-level + per-business)
CREATE TABLE IF NOT EXISTS public.user_billing (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_billing (
  business_id INTEGER NOT NULL PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  tier SMALLINT NOT NULL DEFAULT 0 CHECK (tier >= 0 AND tier <= 2),
  slot_limit INT NOT NULL DEFAULT 1 CHECK (slot_limit > 0),
  slots_used INT NOT NULL DEFAULT 0 CHECK (slots_used >= 0),
  stripe_subscription_item_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS business_billing_tier_idx ON public.business_billing (tier);

CREATE INDEX IF NOT EXISTS reviews_connection_id_idx ON public.reviews (connection_id);
CREATE INDEX IF NOT EXISTS reviews_reviewer_user_id_idx ON public.reviews (reviewer_user_id);
CREATE INDEX IF NOT EXISTS reviews_reviewed_owner_user_id_idx ON public.reviews (reviewed_owner_user_id);
CREATE INDEX IF NOT EXISTS reviews_reviewer_business_id_idx ON public.reviews (reviewer_business_id)
  WHERE reviewer_business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reviews_reviewer_business_status_idx ON public.reviews (reviewer_business_id, status_id)
  WHERE reviewer_business_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Core-table RLS hardening
-- ---------------------------------------------------------------------------
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms DISABLE ROW LEVEL SECURITY;

-- businesses: owner-scoped CRUD + related read access
DROP POLICY IF EXISTS "Businesses select own rows" ON public.businesses;
DROP POLICY IF EXISTS "Businesses select related rows by connection or review" ON public.businesses;
DROP POLICY IF EXISTS "Businesses insert own rows" ON public.businesses;
DROP POLICY IF EXISTS "Businesses update own rows" ON public.businesses;
DROP POLICY IF EXISTS "Businesses delete own rows" ON public.businesses;

CREATE POLICY "Businesses select own rows"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Businesses select related rows by connection or review"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reviews r
      WHERE (r.reviewer_user_id = auth.uid() OR r.reviewed_owner_user_id = auth.uid())
        AND businesses.id IN (r.reviewed_business_id, COALESCE(r.reviewer_business_id, -1))
    )
  );

CREATE POLICY "Businesses insert own rows"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Businesses update own rows"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Businesses delete own rows"
  ON public.businesses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- business_platforms: only through owned businesses
DROP POLICY IF EXISTS "Business platforms select own business rows" ON public.business_platforms;
DROP POLICY IF EXISTS "Business platforms select review-related rows" ON public.business_platforms;
DROP POLICY IF EXISTS "Business platforms insert own business rows" ON public.business_platforms;
DROP POLICY IF EXISTS "Business platforms update own business rows" ON public.business_platforms;
DROP POLICY IF EXISTS "Business platforms delete own business rows" ON public.business_platforms;

CREATE POLICY "Business platforms select own business rows"
  ON public.business_platforms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_platforms.business_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Business platforms select review-related rows"
  ON public.business_platforms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reviews r
      WHERE r.reviewed_business_id = business_platforms.business_id
        AND (
          r.reviewer_user_id = auth.uid()
          OR r.reviewed_owner_user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Business platforms insert own business rows"
  ON public.business_platforms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_platforms.business_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Business platforms update own business rows"
  ON public.business_platforms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_platforms.business_id
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_platforms.business_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Business platforms delete own business rows"
  ON public.business_platforms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_platforms.business_id
        AND b.user_id = auth.uid()
    )
  );

-- connections: only where user owns a participant business
DROP POLICY IF EXISTS "Connections select own participation rows" ON public.connections;
DROP POLICY IF EXISTS "Connections insert from own initiator business" ON public.connections;
DROP POLICY IF EXISTS "Connections update own participation rows" ON public.connections;
DROP POLICY IF EXISTS "Connections delete own participation rows" ON public.connections;

CREATE POLICY "Connections select own participation rows"
  ON public.connections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.user_id = auth.uid()
        AND b.id IN (connections.business_a_id, connections.business_b_id)
    )
  );

CREATE POLICY "Connections insert from own initiator business"
  ON public.connections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = connections.initiator_business_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Connections update own participation rows"
  ON public.connections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.user_id = auth.uid()
        AND b.id IN (connections.business_a_id, connections.business_b_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.user_id = auth.uid()
        AND b.id IN (connections.business_a_id, connections.business_b_id)
    )
  );

CREATE POLICY "Connections delete own participation rows"
  ON public.connections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.user_id = auth.uid()
        AND b.id IN (connections.business_a_id, connections.business_b_id)
    )
  );

-- reviews: read for participants/owners, writes constrained to role ownership
DROP POLICY IF EXISTS "Reviews select own related rows" ON public.reviews;
DROP POLICY IF EXISTS "Reviews insert own initiated connection rows" ON public.reviews;
DROP POLICY IF EXISTS "Reviews update reviewer or reviewed owner rows" ON public.reviews;
DROP POLICY IF EXISTS "Reviews delete own initiated connection rows" ON public.reviews;

CREATE POLICY "Reviews select own related rows"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (
    reviewer_user_id = auth.uid()
    OR reviewed_owner_user_id = auth.uid()
  );

CREATE POLICY "Reviews insert own initiated connection rows"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.connections c
      JOIN public.businesses b ON b.id = c.initiator_business_id
      WHERE c.id = reviews.connection_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviews update reviewer or reviewed owner rows"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (
    reviewer_user_id = auth.uid()
    OR reviewed_owner_user_id = auth.uid()
  )
  WITH CHECK (
    reviewer_user_id = auth.uid()
    OR reviewed_owner_user_id = auth.uid()
  );

CREATE POLICY "Reviews delete own initiated connection rows"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.connections c
      JOIN public.businesses b ON b.id = c.initiator_business_id
      WHERE c.id = reviews.connection_id
        AND b.user_id = auth.uid()
    )
  );

-- user_preferences: own row only
DROP POLICY IF EXISTS "Users select own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users update own preferences" ON public.user_preferences;

CREATE POLICY "Users select own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_billing: own row read access
DROP POLICY IF EXISTS "Users select own user_billing" ON public.user_billing;

CREATE POLICY "Users select own user_billing"
  ON public.user_billing FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- business_billing: readable for owned businesses
DROP POLICY IF EXISTS "Users select own business_billing" ON public.business_billing;

CREATE POLICY "Users select own business_billing"
  ON public.business_billing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_billing.business_id
        AND b.user_id = auth.uid()
    )
  );

-- Ensure Realtime receives changes from reviews in fresh bootstraps.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'reviews'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
    END IF;
  END IF;
END $$;

-- Ordered account data cleanup, used by account deletion flow.
CREATE OR REPLACE FUNCTION public.delete_user_account_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.reviews
  WHERE reviewer_user_id = target_user_id
     OR reviewed_owner_user_id = target_user_id
     OR reviewer_business_id IN (
       SELECT id FROM public.businesses WHERE user_id = target_user_id
     )
     OR reviewed_business_id IN (
       SELECT id FROM public.businesses WHERE user_id = target_user_id
     );

  DELETE FROM public.business_platforms
  WHERE business_id IN (
    SELECT id FROM public.businesses WHERE user_id = target_user_id
  );

  DELETE FROM public.business_billing
  WHERE business_id IN (
    SELECT id FROM public.businesses WHERE user_id = target_user_id
  );

  DELETE FROM public.businesses WHERE user_id = target_user_id;
  DELETE FROM public.user_preferences WHERE user_id = target_user_id;
  DELETE FROM public.user_billing WHERE user_id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account_data(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(UUID) TO service_role;

