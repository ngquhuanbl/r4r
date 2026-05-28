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
CREATE TRIGGER set_business_platforms_updated_at
BEFORE UPDATE ON public.business_platforms
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();



  -- Review statuses
  CREATE TABLE public.review_statuses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
  );

  -- Insert review statuses
  INSERT INTO public.review_statuses (name, description) VALUES
    ('DRAFT', 'Review is being drafted'),
    ('SUBMITTED', 'Review has been submitted, awaiting verification'),
    ('VERIFIED', 'Review has been verified by the business owner'),
    ('REJECTED', 'Review has been rejected by the business owner');

  CREATE TABLE public.connections (
    id SERIAL PRIMARY KEY,
    business_a_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_b_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    initiator_business_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    partner_acknowledged_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT connections_ordered_pair CHECK (business_a_id < business_b_id),
    CONSTRAINT connections_business_pair_unique UNIQUE (business_a_id, business_b_id)
  );

  -- Connection-backed reviews (two per active connection)
  CREATE TABLE public.reviews (
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

  CREATE INDEX reviews_connection_id_idx ON public.reviews (connection_id);
  CREATE INDEX reviews_reviewer_user_id_idx ON public.reviews (reviewer_user_id);
  CREATE INDEX reviews_reviewed_owner_user_id_idx ON public.reviews (reviewed_owner_user_id);
  CREATE INDEX reviews_reviewer_business_id_idx ON public.reviews (reviewer_business_id)
    WHERE reviewer_business_id IS NOT NULL;
  CREATE INDEX reviews_reviewer_business_status_idx ON public.reviews (reviewer_business_id, status_id)
    WHERE reviewer_business_id IS NOT NULL;

  CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

