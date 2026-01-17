-- Sales table for tracking beat purchases
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
  beat_id UUID REFERENCES beats(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  license_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_producer_id ON sales(producer_id);
CREATE INDEX IF NOT EXISTS idx_sales_beat_id ON sales(beat_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- Add columns to beats table if not exists
ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;
ALTER TABLE beats ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE beats ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Add analytics columns to producers table if not exists
ALTER TABLE producers ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;

-- Add subscription columns to producers table
ALTER TABLE producers ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS max_beats INTEGER DEFAULT 10;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS ai_credits_monthly INTEGER DEFAULT 3;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER DEFAULT 3;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS ai_credits_reset_at TIMESTAMPTZ;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS has_custom_domain BOOLEAN DEFAULT FALSE;

-- Function to increment beat sales count
CREATE OR REPLACE FUNCTION increment_beat_sales(beat_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE beats
  SET sales_count = COALESCE(sales_count, 0) + 1,
      updated_at = NOW()
  WHERE id = beat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment producer sales stats
CREATE OR REPLACE FUNCTION increment_producer_sales(
  producer_id UUID,
  amount DECIMAL,
  sale_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE producers
  SET total_sales = COALESCE(total_sales, 0) + sale_count,
      total_revenue = COALESCE(total_revenue, 0) + amount,
      updated_at = NOW()
  WHERE id = producer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment beat views
CREATE OR REPLACE FUNCTION increment_beat_views(beat_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE beats
  SET views = COALESCE(views, 0) + 1
  WHERE id = beat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policies for sales table
CREATE POLICY "Producers can view their own sales"
  ON sales FOR SELECT
  USING (producer_id IN (
    SELECT id FROM producers WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Service role can insert sales"
  ON sales FOR INSERT
  WITH CHECK (true);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_beat_sales TO service_role;
GRANT EXECUTE ON FUNCTION increment_producer_sales TO service_role;
GRANT EXECUTE ON FUNCTION increment_beat_views TO authenticated;
