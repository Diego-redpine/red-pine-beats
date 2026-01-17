# Red Pine Beats - Deployment Checklist

## Pre-Deployment

### 1. Database Setup (Supabase)

#### Create Required Tables
```sql
-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  producer_id uuid REFERENCES producers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_image_url text,
  bundle_price decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for producer lookup
CREATE INDEX idx_collections_producer ON collections(producer_id);

-- RLS policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can manage own collections"
ON collections FOR ALL
USING (auth.uid() IN (SELECT auth_user_id FROM producers WHERE id = producer_id));
```

#### Update Existing Tables
```sql
-- Add profile_bio to site_customizations
ALTER TABLE site_customizations
ADD COLUMN IF NOT EXISTS profile_bio TEXT;

-- Add notification preferences to producers
ALTER TABLE producers
ADD COLUMN IF NOT EXISTS notify_new_sale BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_customer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_weekly_report BOOLEAN DEFAULT false;

-- Add 2FA columns to producers
ALTER TABLE producers
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT;

-- Add branding columns if missing
ALTER TABLE producers
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#CE0707',
ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

#### Verify RLS Policies
Ensure these policies exist:
- `producers`: Users can read/update own record
- `beats`: Producers can CRUD own beats
- `sales`: Producers can read own sales
- `customers`: Derived from sales (no separate table needed)
- `site_customizations`: Producers can CRUD own customization
- `collections`: Producers can CRUD own collections

### 2. Storage Buckets (Supabase)

Create these buckets with public access:
- `beats` - Audio files (mp3, wav)
- `beat-covers` - Cover art images
- `brand-assets` - Producer logos
- `stems` - Stem files (zip)

### 3. Environment Variables

#### Netlify
Set these in Netlify dashboard (Site Settings → Build & Deploy → Environment):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key (for server functions)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_... (monthly subscription price)
```

#### For Email Service (Optional)
```
SENDGRID_API_KEY=SG....
# OR
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.yourdomain.com
```

### 4. Stripe Configuration

1. **Create Products**
   - Monthly Subscription: $45/month
   - Credit Packages: 10/$10, 50/$40, 100/$70

2. **Set up Webhooks**
   Endpoint: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`

   Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

3. **Connect Setup**
   Enable Stripe Connect for producer payouts

### 5. Netlify Configuration

Ensure `netlify.toml` contains:
```toml
[[redirects]]
  from = "/"
  to = "/login.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

## Deployment Steps

### 1. Connect Repository
- Link GitHub/GitLab repo to Netlify
- Set build settings (none needed for static site)

### 2. Deploy
- Push to main branch triggers deploy
- Or manual deploy from Netlify dashboard

### 3. Verify Netlify Functions
Check these functions deploy correctly:
- `create-subscription-checkout`
- `stripe-webhook`
- (any email notification functions)

### 4. Test Stripe Webhook
Use Stripe CLI to test locally:
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

### 5. DNS Setup (Custom Domain)
1. Add custom domain in Netlify
2. Update DNS records:
   - A record: `@` → Netlify IP
   - CNAME: `www` → `your-site.netlify.app`
3. Enable HTTPS

## Post-Deployment Testing

### Critical Paths
- [ ] Login/signup works
- [ ] Stripe checkout completes
- [ ] Producer account created after payment
- [ ] Dashboard loads with stats
- [ ] Beat upload completes (all steps)
- [ ] Beat editing works
- [ ] Collections CRUD works
- [ ] Store preview loads
- [ ] Profile publishing works
- [ ] Settings save correctly
- [ ] Password change works
- [ ] Theme toggle works

### Console Check
Open DevTools and verify:
- [ ] No 400/500 errors
- [ ] No service worker errors
- [ ] No CORS errors
- [ ] No missing resources

### Mobile Testing
Test on real devices:
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad

## Rollback Plan

1. Keep previous deploy URL (Netlify provides this)
2. If issues, restore previous deploy from Netlify dashboard
3. For database issues, restore from Supabase point-in-time backup

## Monitoring

### Recommended
- Netlify Analytics (built-in)
- Sentry for error tracking
- Stripe Dashboard for payment monitoring

### Alerts to Set Up
- Failed Stripe webhooks
- High error rate
- Site downtime
