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



  -- Review invitation statuses
  CREATE TABLE public.invitation_statuses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
  );

  -- Insert invitation statuses
  INSERT INTO public.invitation_statuses (name, description) VALUES
    ('PENDING', 'Invitation sent, awaiting response'),
    ('ACCEPTED', 'User accepted the invitation'),
    ('REJECTED', 'User rejected the invitation');

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

  -- Initial invitation
  CREATE TABLE public.review_invitations (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    platform_id INTEGER NOT NULL REFERENCES public.platforms(id),
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status_id INTEGER NOT NULL REFERENCES public.invitation_statuses(id),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Review content
  CREATE TABLE public.reviews (
    id SERIAL PRIMARY KEY,
    invitation_id INTEGER NOT NULL REFERENCES public.review_invitations(id) ON DELETE
  CASCADE,
    content TEXT,
    url TEXT,
    status_id INTEGER NOT NULL REFERENCES public.review_statuses(id),
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create triggers for updated_at timestamps
  CREATE OR REPLACE FUNCTION trigger_set_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER set_review_invitations_updated_at
  BEFORE UPDATE ON public.review_invitations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

  CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

