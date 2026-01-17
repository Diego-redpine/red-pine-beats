-- Customers table for CRM functionality
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  first_purchase_at TIMESTAMPTZ DEFAULT NOW(),
  last_purchase_at TIMESTAMPTZ DEFAULT NOW(),
  total_spent DECIMAL(10,2) DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  is_starred BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(producer_id, email)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_producer_id ON customers(producer_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON customers(last_purchase_at DESC);

-- Add branding columns to producers table
ALTER TABLE producers ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#CE0707';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add preview columns to beats table if not exists
ALTER TABLE beats ADD COLUMN IF NOT EXISTS preview_start INTEGER DEFAULT 0;
ALTER TABLE beats ADD COLUMN IF NOT EXISTS preview_end INTEGER DEFAULT 30;

-- Function to upsert customer on sale
CREATE OR REPLACE FUNCTION upsert_customer_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customers (producer_id, email, name, first_purchase_at, last_purchase_at, total_spent, purchase_count)
  VALUES (NEW.producer_id, NEW.customer_email, NEW.customer_name, NEW.created_at, NEW.created_at, NEW.amount, 1)
  ON CONFLICT (producer_id, email) DO UPDATE
  SET
    name = COALESCE(NEW.customer_name, customers.name),
    last_purchase_at = NEW.created_at,
    total_spent = customers.total_spent + NEW.amount,
    purchase_count = customers.purchase_count + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update customers table on new sale
DROP TRIGGER IF EXISTS trigger_upsert_customer ON sales;
CREATE TRIGGER trigger_upsert_customer
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION upsert_customer_on_sale();

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies for customers table
CREATE POLICY "Producers can view their own customers"
  ON customers FOR SELECT
  USING (producer_id IN (
    SELECT id FROM producers WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Producers can update their own customers"
  ON customers FOR UPDATE
  USING (producer_id IN (
    SELECT id FROM producers WHERE email = auth.jwt() ->> 'email'
  ));
