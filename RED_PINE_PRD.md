# Red Pine Producer Platform - Product Requirements Document

**Branch:** ralph/producer-platform-mvp  
**Total Stories:** 25  
**Status:** In Development

---

## BP-001: White-label dashboard with producer's logo and color
**Priority:** 1 | **Status:** ✅ COMPLETED

### Acceptance Criteria:
- On login, if producer has logo_url in database, show it top-left (replace current Red Pine logo)
- If producer has primary_color in database, replace ALL instances of #CE0707 with their color
- Apply to: sidebar background, buttons, hover states, active menu items
- Bottom of sidebar shows: 'Powered by' text + red_pine_logo.png (24px height)
- If no logo_url, show default Red Pine logo
- If no primary_color, use #CE0707 as fallback
- Test: Change primary_color in settings → Reload dashboard → All red becomes new color

**Notes:** Logo path: assets/images/red_pine_logo.png already exists

---

## BP-002: Add light/dark mode toggle
**Priority:** 2 | **Status:** ✅ COMPLETED

### Acceptance Criteria:
- Toggle switch in top-right corner of dashboard
- Light mode: white background (#FFFFFF), dark text (#111111)
- Dark mode: dark background (#1a1a1a), light text (#f5f5f5)
- Save preference to localStorage: theme
- On page load, read localStorage and apply saved theme
- Smooth transition (0.3s) when switching modes
- All pages respect theme: dashboard, beats, store, analytics, settings
- Test: Toggle mode → Refresh page → Mode persists

---

## BP-003: Replace emojis with icon library
**Priority:** 3 | **Status:** ✅ COMPLETED

### Acceptance Criteria:
- Install Lucide Icons (npm install lucide)
- Replace ALL emoji usage with Lucide icons
- Examples: ✍️ → Edit icon, 🛒 → ShoppingCart icon, 👁️ → Eye icon
- Consistent icon size: 20px default, 24px for headers
- Icons inherit color from parent element
- No emojis anywhere in the platform
- Test: Search codebase for emoji characters → None found

**Notes:** Use lucide-react if React, or lucide-icons CDN if vanilla JS

---

## BP-004: Add fluid hover animations
**Priority:** 4 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Sidebar menu items: Scale 1.02, translate 2px right on hover
- Buttons: Scale 1.05, brightness 110% on hover
- Cards: Shadow increases, translate -2px up on hover
- All transitions: 0.3s ease-out
- Beat cards: Scale 1.02 on hover
- Dashboard stat cards: Subtle glow effect on hover
- No jank, smooth 60fps animations
- Test in all browsers: Chrome, Safari, Firefox

---

## BP-005: Make dashboard fully responsive (mobile/tablet/desktop)
**Priority:** 5 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Mobile (<768px): Sidebar collapses to hamburger menu
- Tablet (768-1024px): Sidebar stays visible, cards stack 2-column
- Desktop (>1024px): Sidebar + 3-column card grid
- All text scales appropriately (16px mobile, 18px desktop)
- Buttons have min-height 44px for touch targets
- Test on iPhone SE, iPad, MacBook Pro sizes
- No horizontal scroll on any device
- Screenshot verification on 3 device sizes

---

## BP-006: Redesign beat list with SoundCloud-style waveform
**Priority:** 6 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Install Wavesurfer.js: npm install wavesurfer.js
- Beat list layout: [Cover 80x80] [Title] [Price] [Waveform center] [Sales] [Actions]
- Remove: BPM, Key, Views, Revenue from list view
- Waveform: 400px wide, 60px height, gradient colors based on primary_color
- Click waveform to play/pause beat
- Show play/pause icon overlay on waveform
- Waveform scrubbing: Click to seek position
- Test: Upload beat → See waveform → Click to play → Scrub works

**Notes:** Wavesurfer.js is free, MIT license

---

## BP-007: Create beat edit pop-up modal with all details
**Priority:** 7 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Click 'Edit' action → Modal appears (overlay + centered card)
- Modal shows: Cover art (large), Title, Price, BPM, Key, Genre
- Show: Views count, Sales count, Revenue amount
- Show: Pricing tiers (Basic, Premium, Exclusive) with checkboxes
- Edit button for each field (inline editing)
- Save button at bottom
- Close button (X) top-right
- Click outside modal → Close modal
- Test: Edit beat → Save → Reload page → Changes persist

---

## BP-008: Build onboarding quiz (producer setup flow)
**Priority:** 8 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- After signup, show fullscreen modal (can't dismiss)
- Step 1: 'What's your producer name?' (text input)
- Step 2: 'Upload your logo' (file upload, accept .png/.jpg, max 2MB)
- Step 3: 'Pick your primary color' (color picker)
- Step 4: 'Connect Stripe' (button → Stripe Connect OAuth)
- Step 5: 'Choose your subdomain' (text input, check availability)
- Progress indicator: Steps 1/5, 2/5, etc.
- Can't skip steps, must complete all
- On complete: Save to producers table → Redirect to dashboard
- Test: Create account → Complete quiz → See dashboard with branding applied

---

## BP-009: Add Stripe Connect integration for producer payouts
**Priority:** 9 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Install stripe package: npm install stripe
- Create Stripe Connect account link
- Onboarding: 'Connect Stripe' button → OAuth flow
- Save stripe_account_id to producers table
- Settings page: Show Stripe status (Connected / Not Connected)
- If not connected, show 'Connect Stripe' button
- If connected, show 'Manage Stripe Account' link
- Test: Complete onboarding → Stripe connected → See status in settings

---

## BP-010: Build beat upload flow (quiz-style, multi-step)
**Priority:** 10 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Click 'Upload Beat' → Modal appears
- Step 1: Beat title (text input) + Cover art upload (drag-and-drop)
- Step 2: Audio file upload (.mp3/.wav, max 50MB) + Genre dropdown
- Step 3: Show 'Analyzing...' while detecting BPM and key using Web Audio API
- Step 4: Pricing - Checkboxes for Basic/Premium/Exclusive + price inputs
- Step 5: Preview section picker (30/60/full toggle + waveform scrubber)
- Step 6: Review all info + Upload button
- Show progress bar during upload
- On success: Close modal, refresh beat list, show success message
- Test: Upload beat with all fields → See in list with waveform

**Notes:** BPM detection: Use Web Audio API + beat-detector library

---

## BP-011: Implement BPM and key detection using Web Audio API
**Priority:** 11 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Install package: npm install web-audio-beat-detector music-key-detection
- After audio file upload, decode audio buffer
- Run BPM detection algorithm (analyze tempo)
- Run key detection algorithm (analyze pitch)
- Show loading spinner: 'Analyzing BPM and key...'
- Display detected BPM (e.g., '140 BPM') and key (e.g., 'F Minor')
- Allow manual override (edit button next to detected values)
- If detection fails, show error and require manual entry
- Test: Upload beat → Wait 2-5 seconds → See detected BPM and key

---

## BP-012: Add beat preview section picker (30/60/full + custom range)
**Priority:** 12 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Step 5 of beat upload: Preview controls
- Radio buttons: 30 seconds / 60 seconds / Full song
- If 30 or 60 selected, show waveform scrubber
- User drags handles to select which 30/60 seconds to preview
- Show timestamp: 'Preview: 0:15 - 0:45'
- Play button to test preview section
- Save preview_start and preview_end to beats table
- On public store, only selected section plays
- Test: Upload beat → Select 30sec preview at 1:00-1:30 → Verify on store

---

## BP-013: Build Profile vs Site choice modal (first-time editor access)
**Priority:** 13 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- When user clicks 'Store' tab for first time, show modal
- Modal title: 'How do you want to build your store?'
- Two large buttons: [Profile] [Site]
- Profile description: 'Quick Linktree-style page with links and gallery'
- Site description: 'Full website builder with drag-and-drop and AI chat'
- Choice saved to database: site_mode = 'profile' or 'site'
- If Profile chosen → Load preset template editor
- If Site chosen → Load blank canvas + chat interface
- Don't show modal again after choice is made
- Test: Choose Profile → See template. New user → Choose Site → See canvas.

---

## BP-014: Build Profile editor (Linktree-style preset template)
**Priority:** 14 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- If site_mode = 'profile', load template editor
- Template structure: Profile pic (circular, 120px) + Name + Bio + Links + Gallery
- Profile pic: Click to upload, crop to square, save to Supabase storage
- Name: Click to edit inline (contenteditable)
- Bio: Click to edit inline (textarea expands)
- Links: Add/remove/reorder buttons (unlimited)
- Each link: Icon dropdown + Text + URL
- Gallery: Drag-and-drop upload (3-column grid, unlimited images)
- Can't remove profile pic or name sections (locked)
- Can add text/image components around profile
- Save button → Preview button → Publish button
- Test: Edit profile → Add 5 links → Upload 6 gallery images → Publish → Visit subdomain

---

## BP-015: Build Site editor foundation (chat interface + canvas)
**Priority:** 15 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- If site_mode = 'site', load full editor
- Layout: Left sidebar (component library) + Center canvas + Right sidebar (chat + properties)
- Chat interface: Text input at bottom, chat history above, send button
- Canvas: White background, grid overlay (toggle on/off), responsive preview toggle
- Component library: Hero, Text, Image, Button, Video, Beat Catalog, Spacer
- Drag component from library → Drop on canvas → Component appears
- Click component → Shows in properties panel
- Delete key → Remove selected component
- Save/Preview/Publish buttons in top bar
- Test: Drag 3 components → Arrange them → Save

---

## BP-016: Integrate Claude API for AI-powered component generation
**Priority:** 16 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Install @anthropic-ai/sdk: npm install @anthropic-ai/sdk
- Add ANTHROPIC_API_KEY to environment variables
- Create function: generateComponent(userMessage) → calls Claude API
- System prompt: 'Generate component JSON for Red Pine editor. Available: Hero, Text, Image, Button, Video, Beat Catalog. Return JSON: {type, content, styles}'
- Parse Claude's response, extract JSON
- Render component on canvas based on JSON
- Handle errors: rate limit, invalid response, API down
- Test: Type 'Create a hero section with dark background' → Component appears

**Notes:** API key goes in Netlify env vars

---

## BP-017: Implement AI request credits system (10/month, rollover, purchase)
**Priority:** 17 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Add to producers table: ai_requests_used (default 0), ai_requests_limit (default 10), ai_requests_reset_date
- Before AI request, check: if used >= limit, show 'Buy more credits' modal
- After AI request, increment ai_requests_used by 1
- Show counter in editor: 'X requests left this month'
- Cron job (daily): If today >= reset_date, set used = 0, reset_date = 30 days from now
- Rollover: Don't reset unused requests (if had 10, used 5, next month = 15 available)
- Buy credits modal: 10 for $10 / 50 for $40 / 100 for $70
- Stripe payment → Add credits to ai_requests_limit
- Test: Use 10 requests → Hit limit → Buy 10 more → Continue building

---

## BP-018: Build component property editor (right sidebar)
**Priority:** 18 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- When component selected, right sidebar shows properties
- Tabs: Content / Style / Animation
- Content tab: Edit text, upload image, change link URL
- Style tab: Color pickers (background, text), font dropdown (20 fonts), padding/margin sliders
- Animation tab: Animation type dropdown (None, Fade In, Slide In, etc.), duration slider
- Changes update preview instantly (live editing)
- Close properties panel when component deselected
- Test: Select text component → Change color to blue → See instant preview update

---

## BP-019: Add Beat Catalog component to editor
**Priority:** 19 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Component type: 'Beat Catalog'
- Drag to canvas OR say 'Add my beat catalog'
- Component queries beats table for producer's beats
- Displays in grid: cover art, title, price, waveform, play button
- Customizable: grid columns (2/3/4), card background color, text color
- Auto-updates when beats are added/removed
- On public site, clicking beat → Stripe checkout
- Test: Add catalog component → Upload new beat → See it appear in catalog

---

## BP-020: Add Stripe checkout flow for beat purchases
**Priority:** 20 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- On public store, click beat 'Buy' button → Redirect to Stripe Checkout
- Create Stripe Checkout Session with beat price
- Use producer's stripe_account_id (Connect) for payouts
- Success URL: /success?beat_id=X
- Cancel URL: /store
- On success: Save to sales table (beat_id, customer_email, amount, license_type)
- Send email to customer with beat download link (MP3/WAV/Stems based on license)
- Test: Buy beat with test card → Success page → Receive email with download

---

## BP-021: Add producer subscription billing ($45/month)
**Priority:** 21 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- After onboarding, create Stripe Subscription for producer
- Price: $45/month
- Product name: 'Red Pine Producer Plan'
- Save subscription_id to producers table
- If subscription cancelled/expired, show 'Reactivate' banner in dashboard
- Settings page: Show subscription status, next billing date, cancel button
- Webhook handler for subscription.updated and subscription.deleted
- If subscription deleted, disable account (can't upload beats or edit store)
- Test: Create account → Subscription created → Cancel subscription → See banner

---

## BP-022: Build save/publish workflow for editor
**Priority:** 22 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Save button: Saves site_pages.page_data (JSONB) to database
- page_data structure: {components: [...], settings: {backgroundColor, customCSS}}
- Auto-save every 30 seconds while editing
- Show 'Saving...' indicator during save
- Publish button: Copies draft to published_site, sets is_published = true
- Published site goes live at subdomain.redpine.systems immediately
- Preview button: Opens in new tab with unpublished changes
- Test: Build site → Save → Publish → Visit subdomain → See live site

---

## BP-023: Add dashboard 6th card (Conversion Rate)
**Priority:** 23 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Calculate: (Total Sales / Total Views) × 100
- Display as percentage: '2.5% conversion rate'
- Card shows percentage + sparkline graph (last 7 days)
- If no views yet, show '-- conversion rate' with dash
- Hover: Show tooltip with formula explanation
- Update in real-time when sales or views change
- Test: Generate 100 views + 5 sales → See '5.0%' conversion rate

---

## BP-024: Add responsive design for all breakpoints
**Priority:** 24 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Mobile (<768px): Single column, hamburger menu, full-width cards
- Tablet (768-1024px): Two columns, condensed sidebar, medium cards
- Desktop (>1024px): Three columns, full sidebar, large cards
- Text scales: 14px mobile, 16px tablet, 18px desktop
- Touch targets: Minimum 44x44px on mobile
- Test on: iPhone SE (375px), iPad (768px), MacBook (1440px)
- No horizontal scroll on any device
- Screenshot verification on all 3 sizes

---

## BP-025: Deploy to production and test end-to-end
**Priority:** 25 | **Status:** 🔄 PENDING

### Acceptance Criteria:
- Push all changes to main branch
- Netlify auto-deploys to beats.redpine.systems
- Test signup flow: Create account → Onboarding → Dashboard loads
- Test beat upload: Upload beat → See in list with waveform → Click play works
- Test store editor: Choose Site → AI chat works → Drag components works → Publish works
- Test public store: Visit subdomain → See published site → Buy beat works
- Test white-labeling: Upload logo → Change color → See across all pages
- Test light/dark mode: Toggle → Persists after refresh
- No console errors in production
- All animations smooth (60fps)

---

## Summary

**Completed:** 3/25 stories (12%)  
**In Progress:** 0/25 stories  
**Pending:** 22/25 stories (88%)  

**Next Up:** BP-004 through BP-025

---

**Generated:** January 15, 2026  
**Last Updated:** January 15, 2026 at 3:30 AM
