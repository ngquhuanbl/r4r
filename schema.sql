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

-- ---------------------------------------------------------------------------
-- Compatibility guards for partially-migrated databases.
-- These keep schema.sql runnable when legacy tables already exist.
-- ---------------------------------------------------------------------------
ALTER TABLE public.connections
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS connection_id INTEGER,
  ADD COLUMN IF NOT EXISTS platform_id INTEGER,
  ADD COLUMN IF NOT EXISTS reviewed_business_id INTEGER,
  ADD COLUMN IF NOT EXISTS reviewed_owner_user_id UUID,
  ADD COLUMN IF NOT EXISTS reviewer_user_id UUID,
  ADD COLUMN IF NOT EXISTS reviewer_business_id INTEGER,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS status_id INTEGER,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing FK targets used by current app flows/policies.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_platform_id_fkey'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_platform_id_fkey
      FOREIGN KEY (platform_id) REFERENCES public.platforms(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_reviewed_business_id_fkey'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_reviewed_business_id_fkey
      FOREIGN KEY (reviewed_business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_reviewed_owner_user_id_fkey'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_reviewed_owner_user_id_fkey
      FOREIGN KEY (reviewed_owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_reviewer_user_id_fkey'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_reviewer_user_id_fkey
      FOREIGN KEY (reviewer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_status_id_fkey'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_status_id_fkey
      FOREIGN KEY (status_id) REFERENCES public.review_statuses(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_connection_id_fkey'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_connection_id_fkey
      FOREIGN KEY (connection_id) REFERENCES public.connections(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_reviewer_business_id_fkey'
      AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_reviewer_business_id_fkey
      FOREIGN KEY (reviewer_business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
  END IF;
END $$;

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
      FROM public.connections c
      JOIN public.businesses me ON me.user_id = auth.uid()
      WHERE me.id IN (c.business_a_id, c.business_b_id)
        AND businesses.id IN (c.business_a_id, c.business_b_id)
    )
    OR EXISTS (
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
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.user_id = auth.uid()
        AND b.id IN (reviews.reviewed_business_id, COALESCE(reviews.reviewer_business_id, -1))
    )
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

