# 🌐 RED PINE - SUBDOMAIN SETUP GUIDE

## 🎯 HOW ROUTING WORKS:

### Main Domain (beats.redpinemarketing.com):
✅ Loads `login.html` first (your dashboard login)
- Users log in here to access their producer dashboard

### Dashboard Subdomain (dashboard.redpine.systems):
✅ Loads `dashboard.html` (producer dashboard)
- Authenticated producers manage their beats here

### Producer Subdomains (e.g., diegor.redpine.systems):
✅ Loads `public-store.html` (public store)
- Customer-facing store for buying beats
- Each producer gets their own subdomain

---

## 🔧 NETLIFY SETUP:

### Step 1: Deploy Site
1. Drag entire `red-pine-complete-deploy` folder to Netlify
2. Wait for deployment to complete

### Step 2: Configure Custom Domain
1. Go to **Site settings** → **Domain management**
2. Add custom domain: `beats.redpinemarketing.com`
3. Add domain alias: `beats.redpine.systems` (if using both)
4. Follow Netlify's DNS instructions

### Step 3: Enable Wildcard Subdomains
1. In **Domain management**, click **Options** → **Set up wildcard subdomain**
2. Add DNS record: `CNAME *.redpine.systems → your-site.netlify.app`
3. Or for .com: `CNAME *.redpinemarketing.com → your-site.netlify.app`

**CRITICAL**: Wildcard DNS is required for producer stores (diegor.redpine.systems, etc.)

---

## 🗄️ SUPABASE SETUP:

### Required Tables:

#### 1. `producers` table:
```sql
CREATE TABLE producers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subdomain TEXT UNIQUE NOT NULL,  -- e.g., "diegor"
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `site_customizations` table:
```sql
CREATE TABLE site_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID REFERENCES producers(id),
  template TEXT DEFAULT 'gradient-hero',
  
  -- Header
  logo_url TEXT,
  logo_text TEXT,
  header_bg_color TEXT DEFAULT '#111111',
  header_bg_image TEXT,
  header_brandname_typography TEXT DEFAULT 'Oswald',
  header_brandname_color TEXT DEFAULT '#FFFFFF',
  header_login_btn_color TEXT,
  header_cart_btn_color TEXT,
  header_button_typography TEXT DEFAULT 'Inter',
  
  -- Hero
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_bio TEXT,
  hero_background TEXT,
  hero_bg_color TEXT,
  hero_text_color TEXT,
  hero_typography TEXT DEFAULT 'Oswald',
  
  -- Feature
  feature_text_color TEXT,
  feature_typography TEXT DEFAULT 'Inter',
  feature_bg_color TEXT,
  feature_bg_image TEXT,
  feature_button_color TEXT,
  feature_button_typography TEXT DEFAULT 'Inter',
  
  -- Catalog
  catalog_text_color TEXT,
  catalog_typography TEXT DEFAULT 'Inter',
  catalog_bg_color TEXT,
  catalog_bg_image TEXT,
  catalog_button_color TEXT,
  catalog_button_typography TEXT DEFAULT 'Inter',
  
  -- Footer
  footer_bg_color TEXT,
  footer_bg_image TEXT,
  footer_social_icon_color TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  social_youtube TEXT,
  
  -- Login
  login_logo_url TEXT,
  login_brandname TEXT,
  login_typography TEXT DEFAULT 'Oswald',
  login_bg_color TEXT DEFAULT '#F9FAFB',
  login_bg_image TEXT,
  login_button_color TEXT DEFAULT '#CE0707',
  login_button_typography TEXT DEFAULT 'Inter',
  
  -- Colors
  primary_color TEXT DEFAULT '#CE0707',
  secondary_color TEXT DEFAULT '#111111',
  background_color TEXT DEFAULT '#FFFFFF',
  
  -- Fonts
  heading_font TEXT DEFAULT 'Oswald',
  body_font TEXT DEFAULT 'Inter',
  
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `beats` table:
```sql
CREATE TABLE beats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID REFERENCES producers(id),
  title TEXT NOT NULL,
  bpm INTEGER,
  key TEXT,
  genre TEXT,
  price DECIMAL(10,2),
  audio_url TEXT,
  cover_art_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Required Storage Buckets:
1. **logos** - For producer logos
   - Make public: Bucket settings → Public bucket
2. **cover-art** - For background images and beat artwork
   - Make public: Bucket settings → Public bucket

---

## 🐛 TROUBLESHOOTING:

### Issue: "diegor.redpine.systems" not working

**Likely Cause**: Wildcard DNS not set up

**Fix**:
1. Go to your DNS provider (Netlify or external)
2. Add wildcard CNAME record:
   ```
   Type: CNAME
   Name: *
   Value: your-site.netlify.app
   ```
3. Wait 5-10 minutes for DNS propagation
4. Test: `https://diegor.redpine.systems` should load public store

---

### Issue: "beats.redpinemarketing.com" loads public store instead of login

**Likely Cause**: `_redirects` file not deployed correctly

**Fix**:
1. Verify `_redirects` file is in root of deploy folder
2. Re-deploy to Netlify
3. Check Netlify deploy log for redirect rules
4. Clear browser cache and test

---

### Issue: Producer store showing wrong customization

**Likely Cause**: Subdomain not matching producer record

**Fix**:
1. Check Supabase `producers` table
2. Verify `subdomain` column matches URL
   - URL: `diegor.redpine.systems` → subdomain: `"diegor"`
3. Ensure `site_customizations.producer_id` matches

---

### Issue: Images not loading in store

**Likely Cause**: Supabase storage buckets not public

**Fix**:
1. Go to Supabase → Storage
2. Select `logos` bucket → Settings → Make public
3. Select `cover-art` bucket → Settings → Make public
4. Update bucket policies if needed

---

## ✅ TESTING CHECKLIST:

### Main Domain:
- [ ] Visit `beats.redpinemarketing.com` → Should load login.html
- [ ] Login form should appear
- [ ] Can navigate to signup.html
- [ ] Can navigate to dashboard after login

### Dashboard:
- [ ] Visit `dashboard.redpine.systems` → Should load dashboard
- [ ] Can access beats.html
- [ ] Can access upload.html
- [ ] Can access customize.html
- [ ] Can access settings.html
- [ ] Can access analytics.html

### Producer Stores:
- [ ] Visit `diegor.redpine.systems` → Should load public-store.html
- [ ] Store shows producer's customization
- [ ] Store shows producer's beats
- [ ] Beat cards render correctly
- [ ] Social links work (if set)
- [ ] Colors match customization
- [ ] Typography matches customization

### Store Preview:
- [ ] Visit `store-preview.html?producer=PRODUCER_ID`
- [ ] Shows current customization
- [ ] All sections render correctly
- [ ] All colors/fonts apply correctly

---

## 🔐 ENVIRONMENT VARIABLES:

Add these in Netlify → Site settings → Environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_test_...
```

Also update in `assets/js/config.js`:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

---

## 📊 HOW IT WORKS:

1. **User visits beats.redpinemarketing.com**
   - `_redirects` rule matches main domain
   - Loads `login.html`
   - User logs in to access dashboard

2. **Producer customizes store at customize.html**
   - Saves to `site_customizations` table
   - Changes saved with `producer_id`

3. **Customer visits diegor.redpine.systems**
   - `public-store.html` loads
   - JavaScript extracts subdomain: `"diegor"`
   - Queries Supabase for producer with subdomain="diegor"
   - Loads that producer's customization
   - Renders store with their settings

4. **Preview system**
   - `store-preview.html?producer=UUID`
   - Loads customization by producer ID
   - Shows real-time preview of changes

---

## 🎉 YOU'RE READY!

Once DNS propagates (5-10 minutes), all subdomains should work:
- ✅ beats.redpinemarketing.com → Login
- ✅ dashboard.redpine.systems → Dashboard
- ✅ diegor.redpine.systems → Diego's Public Store
- ✅ anyproducer.redpine.systems → Their Public Store

**Need help?** Check Netlify deploy logs and browser console for errors.
