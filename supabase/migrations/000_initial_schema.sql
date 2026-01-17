-- Red Pine Initial Database Schema
-- Run this migration first to set up the base tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS producers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  producer_name TEXT NOT NULL,
  subdomain TEXT UNIQUE,

  -- Profile info
  bio TEXT,
  profile_photo_url TEXT,

  -- Social links
  social_instagram TEXT,
  social_twitter TEXT,
  social_youtube TEXT,
  social_spotify TEXT,
  social_soundcloud TEXT,

  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_account_status TEXT DEFAULT 'pending',

  -- Subscription (added in 001_checkout_schema.sql)
  stripe_customer_id TEXT,
  subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_plan TEXT DEFAULT 'free',
  subscription_current_period_end TIMESTAMPTZ,
  max_beats INTEGER DEFAULT 10,
  ai_credits_monthly INTEGER DEFAULT 3,
  ai_credits_remaining INTEGER DEFAULT 3,
  ai_credits_reset_at TIMESTAMPTZ,
  has_custom_domain BOOLEAN DEFAULT FALSE,

  -- Analytics
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_views INTEGER DEFAULT 0,

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BEATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS beats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  genre TEXT,
  mood TEXT,
  tags TEXT[],

  -- Audio analysis
  bpm INTEGER,
  key TEXT,
  duration INTEGER, -- in seconds

  -- Files
  audio_url TEXT,
  audio_preview_url TEXT,
  cover_art_url TEXT,
  stems_url TEXT,

  -- Preview section (start/end in seconds)
  preview_start INTEGER DEFAULT 0,
  preview_end INTEGER DEFAULT 30,

  -- Pricing
  price_basic DECIMAL(10,2) DEFAULT 30,
  price_premium DECIMAL(10,2) DEFAULT 75,
  price_exclusive DECIMAL(10,2) DEFAULT 300,

  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  is_sold BOOLEAN DEFAULT FALSE,
  sold_at TIMESTAMPTZ,

  -- Analytics
  views INTEGER DEFAULT 0,
  plays INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SITE CUSTOMIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS site_customizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE UNIQUE,

  -- Site mode
  site_mode TEXT DEFAULT 'site', -- 'site' or 'profile'

  -- Template
  template TEXT DEFAULT 'gradient-hero',

  -- Colors
  primary_color TEXT DEFAULT '#CE0707',
  secondary_color TEXT DEFAULT '#111111',
  hero_bg_color TEXT DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  hero_text_color TEXT DEFAULT '#FFFFFF',
  header_bg_color TEXT DEFAULT '#111111',
  footer_bg_color TEXT DEFAULT '#111111',

  -- Typography
  heading_font TEXT DEFAULT 'Oswald',
  body_font TEXT DEFAULT 'Inter',
  hero_typography TEXT DEFAULT 'Oswald',
  header_brandname_typography TEXT DEFAULT 'Oswald',

  -- Logo
  logo_url TEXT,
  logo_text TEXT,

  -- Hero section
  hero_title TEXT DEFAULT 'Welcome to My Store',
  hero_subtitle TEXT DEFAULT 'Premium Beats & Instrumentals',
  hero_bio TEXT,
  hero_background TEXT,

  -- Social links
  social_instagram TEXT,
  social_twitter TEXT,
  social_youtube TEXT,

  -- Components (JSON array of component configs)
  components JSONB DEFAULT '[]',

  -- Publish status
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILE CUSTOMIZATIONS TABLE (Linktree-style)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_customizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE UNIQUE,

  -- Profile info
  display_name TEXT,
  bio TEXT,
  photo_url TEXT,

  -- Theme
  theme_color TEXT DEFAULT '#CE0707',
  background_type TEXT DEFAULT 'solid', -- 'solid', 'gradient', 'image'
  background_value TEXT DEFAULT '#FFFFFF',

  -- Social links
  social_instagram TEXT,
  social_twitter TEXT,
  social_youtube TEXT,
  social_spotify TEXT,

  -- Custom links (JSON array)
  custom_links JSONB DEFAULT '[]',

  -- Featured beats (array of beat IDs)
  featured_beats UUID[],

  -- Publish status
  is_published BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_producers_email ON producers(email);
CREATE INDEX IF NOT EXISTS idx_producers_subdomain ON producers(subdomain);
CREATE INDEX IF NOT EXISTS idx_beats_producer_id ON beats(producer_id);
CREATE INDEX IF NOT EXISTS idx_beats_is_published ON beats(is_published);
CREATE INDEX IF NOT EXISTS idx_beats_created_at ON beats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_customizations_producer_id ON site_customizations(producer_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_customizations ENABLE ROW LEVEL SECURITY;

-- Producers policies
CREATE POLICY "Users can view their own producer profile"
  ON producers FOR SELECT
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own producer profile"
  ON producers FOR UPDATE
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own producer profile"
  ON producers FOR INSERT
  WITH CHECK (email = auth.jwt() ->> 'email');

-- Public access to producers for store viewing
CREATE POLICY "Public can view published producers"
  ON producers FOR SELECT
  USING (subdomain IS NOT NULL);

-- Beats policies
CREATE POLICY "Producers can manage their own beats"
  ON beats FOR ALL
  USING (producer_id IN (
    SELECT id FROM producers WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Public can view published beats"
  ON beats FOR SELECT
  USING (is_published = true);

-- Site customizations policies
CREATE POLICY "Producers can manage their own site"
  ON site_customizations FOR ALL
  USING (producer_id IN (
    SELECT id FROM producers WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Public can view published sites"
  ON site_customizations FOR SELECT
  USING (is_published = true);

-- Profile customizations policies
CREATE POLICY "Producers can manage their own profile"
  ON profile_customizations FOR ALL
  USING (producer_id IN (
    SELECT id FROM producers WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Public can view published profiles"
  ON profile_customizations FOR SELECT
  USING (is_published = true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('beats', 'beats', true),
  ('covers', 'covers', true),
  ('logos', 'logos', true),
  ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload beats"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'beats' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view beats"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'beats');

CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_producers_updated_at
  BEFORE UPDATE ON producers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beats_updated_at
  BEFORE UPDATE ON beats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_customizations_updated_at
  BEFORE UPDATE ON site_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_customizations_updated_at
  BEFORE UPDATE ON profile_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
