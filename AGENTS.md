# Red Pine Beats - Developer Documentation

## Overview

Red Pine is a beat-selling platform for music producers. This document covers the codebase architecture, implemented features, and development patterns.

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Netlify (with serverless functions)
- **Payments**: Stripe (Checkout Sessions, Connect)
- **Icons**: Lucide Icons

## Key Files

### Core Pages
- `dashboard.html` - Main producer dashboard with stats and recent sales
- `beats.html` - Beat management with upload, edit, delete
- `customers.html` - Customer CRM with filters and bulk actions
- `analytics.html` - Charts and metrics visualization
- `settings.html` - Account, branding, security, subscriptions
- `store.html` - Store landing page with editor links

### Store/Editor
- `customize-website.html` - Block-based site editor
- `profile-editor.html` - Producer profile editor
- `public-store.html` - Public-facing store template
- `store-published.html` - Post-publish page with custom domain setup

### Auth
- `login.html` - Login page
- `signup.html` - Registration with Stripe Checkout
- `onboarding.html` - New user onboarding flow

### JavaScript
- `assets/js/config.js` - Supabase configuration
- `assets/js/dashboard.js` - Auth check, logout, theme toggle, mobile menu
- `assets/js/branding.js` - Brand color/logo loading

## Design Patterns

### Primary Color
The platform uses `var(--red)` as the primary brand color (#CE0707 default). Producers can customize this in Settings > Dashboard Branding.

```css
:root {
  --red: #CE0707;
  --primary: var(--red);
}
```

### Custom Dropdowns
Native `<select>` elements are replaced with custom dropdowns using the `data-custom-dropdown` attribute. Implementation in beats.html:

```javascript
class CustomDropdown {
  constructor(container) {
    this.container = container;
    // ... initialization
  }
}
```

### Toast Notifications
Use `showToast(message, type)` for user feedback:

```javascript
showToast('Beat saved successfully', 'success');
showToast('Upload failed', 'error');
```

### Loading States
Add `.spinner` class for loading indicators:

```html
<div class="spinner"></div>
```

### Modal Pattern
Standard modal structure:

```html
<div class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">Title</h3>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">Content</div>
    <div class="modal-footer">Actions</div>
  </div>
</div>
```

## Bug Fixes Implemented (v1.0)

### Critical Fixes
1. **Service Worker Cache Error** - Filtered non-http requests in sw.js
2. **Collections Table Missing** - Documented SQL schema for creation
3. **Profile Bio Column** - Added to site_customizations table
4. **Meta Tag Deprecation** - Updated apple-mobile-web-app-capable

### UI Fixes
1. Removed notification bell and profile icons from dashboard
2. Moved Quick Actions to top right
3. Removed Copy/View/Download buttons from beat actions (kept Edit/Delete)
4. Replaced all native dropdowns with custom styled dropdowns
5. Changed all checkboxes to use primary color
6. Removed emojis from upload forms
7. Fixed placeholder image URLs (via.placeholder.com to placehold.co)

### Settings Reorganization
Order: Account Info → Dashboard Branding → Subscription & Credits → Connected Accounts → Notification Preferences → Security → Two-Factor → Change Password → Activity Log → Export Data → Danger Zone

### New Features
1. **Real-time Branding** - Color and logo updates apply instantly
2. **Session Detection** - Shows device type and browser
3. **Activity Log** - Shows recent sales, notifications, login activity
4. **BPM/Key Detection** - Auto-detection in upload flow
5. **Waveform Preview** - Draggable markers for preview selection

## Database Schema Requirements

### Required Tables
```sql
-- Collections
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  producer_id uuid REFERENCES producers(id),
  name text NOT NULL,
  description text,
  cover_image_url text,
  bundle_price decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- Add profile_bio to site_customizations
ALTER TABLE site_customizations
ADD COLUMN IF NOT EXISTS profile_bio TEXT;
```

### Required Columns (producers table)
- `primary_color` - Dashboard branding color
- `logo_url` - Custom logo URL
- `notify_new_sale` - Boolean for sale notifications
- `notify_new_customer` - Boolean for customer notifications
- `notify_weekly_report` - Boolean for weekly report
- `two_factor_enabled` - Boolean for 2FA status
- `two_factor_secret` - TOTP secret
- `backup_codes` - Comma-separated backup codes

## Troubleshooting

### "Producer account not found"
The user completed auth signup but producer record wasn't created. Check:
1. Stripe webhook success
2. `create-subscription-checkout` function logs
3. Producer creation query in signup flow

### 400 Errors on Sales Queries
Verify:
1. Foreign key relationships (sales → beats)
2. RLS policies allow producer access
3. Table columns match query select

### Service Worker Cache Errors
Filter non-http URLs:
```javascript
if (!event.request.url.startsWith('http')) return;
```

## Environment Variables

Required in Netlify:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID` (monthly subscription)
