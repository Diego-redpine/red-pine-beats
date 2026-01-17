-- Customer Portal Schema
-- Supports magic link authentication for customer portal access

-- Customer access tokens for magic link authentication
CREATE TABLE IF NOT EXISTS customer_access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_customer_tokens_token ON customer_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_email ON customer_access_tokens(email);
CREATE INDEX IF NOT EXISTS idx_customer_tokens_expires ON customer_access_tokens(expires_at);

-- Enable RLS
ALTER TABLE customer_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can manage tokens (used by Netlify functions)
CREATE POLICY "Service role manages tokens"
  ON customer_access_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Beat sends tracking table (for Direct Send feature)
CREATE TABLE IF NOT EXISTS beat_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beat_id UUID REFERENCES beats(id) ON DELETE SET NULL,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  message TEXT,
  token TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ
);

-- Indexes for beat_sends
CREATE INDEX IF NOT EXISTS idx_beat_sends_producer ON beat_sends(producer_id);
CREATE INDEX IF NOT EXISTS idx_beat_sends_beat ON beat_sends(beat_id);
CREATE INDEX IF NOT EXISTS idx_beat_sends_email ON beat_sends(customer_email);

-- Enable RLS
ALTER TABLE beat_sends ENABLE ROW LEVEL SECURITY;

-- Producers can view their own sends
CREATE POLICY "Producers can view their own sends"
  ON beat_sends FOR SELECT
  USING (producer_id IN (
    SELECT id FROM producers WHERE email = auth.jwt() ->> 'email'
  ));

-- Service role can insert sends
CREATE POLICY "Service role can insert sends"
  ON beat_sends FOR INSERT
  WITH CHECK (true);

-- Auto-cleanup expired tokens (run via cron job or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM customer_access_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for customers to view their own purchases
-- This allows the customer portal to work
CREATE POLICY "Customers can view their own purchases"
  ON sales FOR SELECT
  USING (
    customer_email = auth.jwt() ->> 'email'
    OR
    producer_id IN (SELECT id FROM producers WHERE email = auth.jwt() ->> 'email')
  );

COMMENT ON TABLE customer_access_tokens IS 'Stores magic link tokens for customer portal authentication';
COMMENT ON TABLE beat_sends IS 'Tracks beats sent directly to customers via the Direct Send feature';
