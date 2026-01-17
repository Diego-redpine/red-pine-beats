// Dashboard functionality for Red Pine

// Check if user is logged in
async function checkAuth() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  
  return user;
}

// Logout with confirmation
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  showLogoutModal();
});

function showLogoutModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Confirm Logout</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-text">Are you sure you want to log out?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-danger" onclick="confirmLogout()">Logout</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function confirmLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Load dashboard data
async function loadDashboard() {
  const user = await checkAuth();
  if (!user) return;
  
  try {
    // Get producer data
    const { data: producer, error: producerError } = await supabaseClient
      .from('producers')
      .select('*')
      .eq('email', user.email)
      .single();
    
    if (producerError) {
      // If no producer found, show friendly message instead of error popup
      console.error('Producer not found:', producerError);
      document.getElementById('welcomeMessage').innerHTML = `
        <div class="alert alert-error">
          Account setup incomplete. Please contact support or <a href="signup.html">complete signup</a>.
        </div>
      `;
      return;
    }
    
    if (producer) {
      // AUTH-010: Check if onboarding is completed
      if (producer.onboarding_completed === false) {
        window.location.href = 'onboarding.html';
        return;
      }
      document.getElementById('welcomeMessage').textContent = `Welcome back, ${producer.name}!`;
    }
    
    // Get beats count
    const { count: beatsCount } = await supabaseClient
      .from('beats')
      .select('*', { count: 'exact', head: true })
      .eq('producer_id', producer.id);
    
    document.getElementById('totalBeats').textContent = beatsCount || 0;
    
    // Get total views
    const { data: beats } = await supabaseClient
      .from('beats')
      .select('views')
      .eq('producer_id', producer.id);
    
    const totalViews = beats?.reduce((sum, beat) => sum + (beat.views || 0), 0) || 0;
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    
    // Get sales count and revenue
    const { data: sales } = await supabaseClient
      .from('sales')
      .select('amount')
      .eq('producer_id', producer.id);
    
    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
    
    document.getElementById('totalSales').textContent = totalSales;
    document.getElementById('totalRevenue').textContent = `$${(totalRevenue / 100).toFixed(2)}`;

    // Calculate conversion rate (sales / views)
    const conversionRate = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(2) : 0;
    const conversionEl = document.getElementById('conversionRate');
    if (conversionEl) {
      conversionEl.textContent = `${conversionRate}%`;
    }

    // Get total customers count
    const { count: customersCount } = await supabaseClient
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('producer_id', producer.id);

    const totalCustomersEl = document.getElementById('totalCustomers');
    if (totalCustomersEl) {
      totalCustomersEl.textContent = customersCount || 0;
    }

    // Load revenue for last 7 days (DB-009)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: recentRevenue } = await supabaseClient
      .from('sales')
      .select('amount, created_at')
      .eq('producer_id', producer.id)
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: previousRevenue } = await supabaseClient
      .from('sales')
      .select('amount')
      .eq('producer_id', producer.id)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    const revenue7Days = recentRevenue?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const revenuePrevious = previousRevenue?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const revenueTrendPercent = revenuePrevious > 0 ? ((revenue7Days - revenuePrevious) / revenuePrevious * 100).toFixed(1) : 0;

    const revenue7DaysEl = document.getElementById('revenue7Days');
    if (revenue7DaysEl) revenue7DaysEl.textContent = `$${(revenue7Days / 100).toFixed(2)}`;

    const revenueTrendEl = document.getElementById('revenueTrend');
    const revenueTrendPercentEl = document.getElementById('revenueTrendPercent');
    if (revenueTrendEl && revenueTrendPercentEl) {
      const isPositive = revenue7Days >= revenuePrevious;
      revenueTrendEl.style.color = isPositive ? '#10B981' : 'var(--red)';
      revenueTrendEl.innerHTML = `<i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}" style="width: 16px; height: 16px;"></i><span>${Math.abs(revenueTrendPercent)}%</span>`;
      lucide.createIcons();
    }

    // Load new customers this month (DB-010)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const { count: newCustomersThisMonth } = await supabaseClient
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('producer_id', producer.id)
      .gte('created_at', startOfMonth.toISOString());

    const { count: newCustomersLastMonth } = await supabaseClient
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('producer_id', producer.id)
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString());

    const newCustomersMonthEl = document.getElementById('newCustomersMonth');
    if (newCustomersMonthEl) newCustomersMonthEl.textContent = newCustomersThisMonth || 0;

    const customersTrendEl = document.getElementById('customersTrend');
    const customersTrendTextEl = document.getElementById('customersTrendText');
    const customersTrendPercentEl = document.getElementById('customersTrendPercent');

    if (customersTrendEl && customersTrendTextEl && customersTrendPercentEl) {
      const diff = (newCustomersThisMonth || 0) - (newCustomersLastMonth || 0);
      const isPositive = diff >= 0;
      const percentChange = newCustomersLastMonth > 0 ? ((diff / newCustomersLastMonth) * 100).toFixed(1) : 0;

      customersTrendEl.style.color = isPositive ? '#10B981' : 'var(--red)';
      customersTrendEl.innerHTML = `<i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}" style="width: 16px; height: 16px;"></i><span>${isPositive ? '+' : ''}${diff} from last month</span>`;
      customersTrendPercentEl.textContent = `${isPositive ? '+' : ''}${percentChange}%`;
      lucide.createIcons();
    }

    // Load recent sales
    const { data: recentSales } = await supabaseClient
      .from('sales')
      .select(`
        *,
        beats (title)
      `)
      .eq('producer_id', producer.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    const salesTableBody = document.getElementById('salesTableBody');
    
    if (recentSales && recentSales.length > 0) {
      salesTableBody.innerHTML = recentSales.map(sale => {
        const date = new Date(sale.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const isRefunded = sale.status === 'refunded';
        return `
        <tr${isRefunded ? ' style="opacity: 0.6;"' : ''}>
          <td>${sale.beats?.title || 'Unknown'}</td>
          <td>${sale.customer_email}</td>
          <td style="text-transform: capitalize;">${sale.license_type}</td>
          <td><strong>${isRefunded ? '<s>' : ''}$${(sale.amount / 100).toFixed(2)}${isRefunded ? '</s> <span style="color: var(--red); font-size: 11px;">Refunded</span>' : ''}</strong></td>
          <td>${formattedDate}</td>
          <td>
            ${!isRefunded ? `
              <button onclick="showRefundModal('${sale.id}', '${sale.beats?.title || 'Unknown'}', ${sale.amount}, '${sale.customer_email}')"
                style="background: none; border: 1px solid var(--gray-medium); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'"
                onmouseout="this.style.borderColor='var(--gray-medium)';this.style.color='inherit'">
                Refund
              </button>
            ` : '<span style="color: var(--gray-dark); font-size: 12px;">-</span>'}
          </td>
        </tr>
      `;
      }).join('');
    } else {
      salesTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--gray-dark); padding: 32px;">
            No sales yet. Upload beats to get started!
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    // Show friendly error without annoying popup
    document.getElementById('welcomeMessage').innerHTML = `
      <div class="alert alert-error">
        Unable to load dashboard data. Please refresh the page.
      </div>
    `;
  }
}

// Run on page load
if (document.getElementById('welcomeMessage')) {
  loadDashboard();
}

// BP-010, BP-011, BP-012: Multi-step Upload Beat Modal with BPM detection
let uploadState = {
  step: 1,
  title: '',
  coverFile: null,
  audioFile: null,
  wavFile: null,
  stemsFile: null,
  genre: '',
  bpm: null,
  key: null,
  previewType: 'full',
  previewStart: 0,
  previewEnd: 0,
  priceBasic: 30,
  pricePremium: null,
  priceExclusive: null
};

function openUploadModal() {
  uploadState = { step: 1, title: '', coverFile: null, audioFile: null, wavFile: null, stemsFile: null, genre: '', bpm: null, key: null, previewType: 'full', previewStart: 0, previewEnd: 0, priceBasic: 30, pricePremium: null, priceExclusive: null };

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'uploadModal';
  modal.innerHTML = `
    <div class="modal-content large" style="max-width: 640px;">
      <div class="modal-header">
        <h3 class="modal-title">Upload New Beat</h3>
        <button class="modal-close" onclick="closeUploadModal()">×</button>
      </div>

      <!-- Progress Steps -->
      <div style="display: flex; justify-content: center; gap: 8px; padding: 16px; background: var(--gray-light);">
        <div class="upload-step-indicator active" id="upload-step-1">1</div>
        <div class="upload-step-indicator" id="upload-step-2">2</div>
        <div class="upload-step-indicator" id="upload-step-3">3</div>
        <div class="upload-step-indicator" id="upload-step-4">4</div>
        <div class="upload-step-indicator" id="upload-step-5">5</div>
        <div class="upload-step-indicator" id="upload-step-6">6</div>
      </div>

      <div class="modal-body" style="min-height: 320px;">
        <!-- Step 1: Title & Cover -->
        <div class="upload-step active" id="upload-content-1">
          <h4 style="text-align: center; margin-bottom: 20px;">What's your beat called?</h4>
          <div class="form-group">
            <input type="text" class="form-input" id="beatTitle" placeholder="Enter beat title..." style="font-size: 18px; text-align: center;">
          </div>
          <div style="margin-top: 24px;">
            <p style="text-align: center; margin-bottom: 12px; color: var(--gray-dark);">Upload cover art</p>
            <div class="file-upload" style="max-width: 200px; margin: 0 auto; height: 200px;" onclick="document.getElementById('beatCoverArt').click()">
              <input type="file" id="beatCoverArt" accept="image/*" style="display: none;">
              <div id="coverPlaceholder" style="text-align: center; color: var(--gray-dark);">
                <div style="margin-bottom: 8px;"><i data-lucide="image" style="width: 48px; height: 48px;"></i></div>
                <div>Click to upload</div>
              </div>
              <img id="coverPreviewImg" style="display: none; width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
            </div>
          </div>
        </div>

        <!-- Step 2: Audio Upload & Genre -->
        <div class="upload-step" id="upload-content-2">
          <h4 style="text-align: center; margin-bottom: 20px;">Upload your audio file</h4>
          <div class="file-upload" style="padding: 40px;" onclick="document.getElementById('beatAudioFile').click()">
            <input type="file" id="beatAudioFile" accept="audio/*" style="display: none;">
            <div id="audioPlaceholder" style="text-align: center; color: var(--gray-dark);">
              <div style="margin-bottom: 8px;"><i data-lucide="music" style="width: 48px; height: 48px;"></i></div>
              <div>Drop audio file or click to upload</div>
              <div style="font-size: 12px; margin-top: 8px;">MP3 or WAV (max 50MB)</div>
            </div>
            <div id="audioFileName" style="display: none; text-align: center; color: var(--black); font-weight: 600;"></div>
          </div>
          <div class="form-group" style="margin-top: 24px;">
            <label class="form-label">Genre</label>
            <div class="custom-dropdown" id="genreDropdown">
              <div class="custom-dropdown-selected" onclick="toggleDropdown('genreDropdown')">
                <span id="genreDropdownText">Select genre...</span>
                <i data-lucide="chevron-down" style="width:16px;height:16px;"></i>
              </div>
              <div class="custom-dropdown-options" id="genreDropdownOptions">
                <div class="custom-dropdown-option" data-value="Hip Hop">Hip Hop</div>
                <div class="custom-dropdown-option" data-value="Trap">Trap</div>
                <div class="custom-dropdown-option" data-value="R&B">R&B</div>
                <div class="custom-dropdown-option" data-value="Pop">Pop</div>
                <div class="custom-dropdown-option" data-value="Drill">Drill</div>
                <div class="custom-dropdown-option" data-value="Afrobeat">Afrobeat</div>
                <div class="custom-dropdown-option" data-value="Lo-Fi">Lo-Fi</div>
                <div class="custom-dropdown-option" data-value="Other">Other</div>
              </div>
            </div>
            <input type="hidden" id="beatGenre" value="">
          </div>
        </div>

        <!-- Step 3: BPM & Key Detection -->
        <div class="upload-step" id="upload-content-3">
          <h4 style="text-align: center; margin-bottom: 20px;">Analyzing your beat...</h4>
          <div id="analysisLoading" style="text-align: center; padding: 40px;">
            <div class="spinner" style="margin: 0 auto 16px;"></div>
            <p style="color: var(--gray-dark);">Detecting BPM and key...</p>
          </div>
          <div id="analysisResults" style="display: none;">
            <div style="display: flex; gap: 24px; justify-content: center; margin-bottom: 24px;">
              <div style="text-align: center; padding: 24px; background: var(--gray-light); border-radius: 12px; min-width: 120px;">
                <div style="font-size: 36px; font-weight: 700; color: var(--red);" id="detectedBpm">--</div>
                <div style="font-size: 14px; color: var(--gray-dark);">BPM</div>
              </div>
              <div style="text-align: center; padding: 24px; background: var(--gray-light); border-radius: 12px; min-width: 120px;">
                <div style="font-size: 36px; font-weight: 700; color: var(--red);" id="detectedKey">--</div>
                <div style="font-size: 14px; color: var(--gray-dark);">Key</div>
              </div>
            </div>
            <p style="text-align: center; color: var(--gray-dark); font-size: 13px;">Not right? Edit below:</p>
            <div class="form-row" style="max-width: 340px; margin: 16px auto 0;">
              <div class="form-group">
                <input type="text" inputmode="numeric" class="form-input bpm-input" id="beatBpm" placeholder="Enter BPM (e.g., 140)" style="text-align: center;">
                <div id="bpmError" style="color: var(--red); font-size: 12px; margin-top: 4px; display: none;"></div>
              </div>
              <div class="form-group">
                <div class="custom-dropdown" id="keyDropdown">
                  <div class="custom-dropdown-selected" onclick="toggleDropdown('keyDropdown')">
                    <span id="keyDropdownText">Key</span>
                    <i data-lucide="chevron-down" style="width:16px;height:16px;"></i>
                  </div>
                  <div class="custom-dropdown-options" id="keyDropdownOptions">
                    <div class="custom-dropdown-option" data-value="C Major">C Major</div>
                    <div class="custom-dropdown-option" data-value="C Minor">C Minor</div>
                    <div class="custom-dropdown-option" data-value="C# Major">C# Major</div>
                    <div class="custom-dropdown-option" data-value="C# Minor">C# Minor</div>
                    <div class="custom-dropdown-option" data-value="D Major">D Major</div>
                    <div class="custom-dropdown-option" data-value="D Minor">D Minor</div>
                    <div class="custom-dropdown-option" data-value="D# Major">D# Major</div>
                    <div class="custom-dropdown-option" data-value="D# Minor">D# Minor</div>
                    <div class="custom-dropdown-option" data-value="E Major">E Major</div>
                    <div class="custom-dropdown-option" data-value="E Minor">E Minor</div>
                    <div class="custom-dropdown-option" data-value="F Major">F Major</div>
                    <div class="custom-dropdown-option" data-value="F Minor">F Minor</div>
                    <div class="custom-dropdown-option" data-value="F# Major">F# Major</div>
                    <div class="custom-dropdown-option" data-value="F# Minor">F# Minor</div>
                    <div class="custom-dropdown-option" data-value="G Major">G Major</div>
                    <div class="custom-dropdown-option" data-value="G Minor">G Minor</div>
                    <div class="custom-dropdown-option" data-value="G# Major">G# Major</div>
                    <div class="custom-dropdown-option" data-value="G# Minor">G# Minor</div>
                    <div class="custom-dropdown-option" data-value="A Major">A Major</div>
                    <div class="custom-dropdown-option" data-value="A Minor">A Minor</div>
                    <div class="custom-dropdown-option" data-value="A# Major">A# Major</div>
                    <div class="custom-dropdown-option" data-value="A# Minor">A# Minor</div>
                    <div class="custom-dropdown-option" data-value="B Major">B Major</div>
                    <div class="custom-dropdown-option" data-value="B Minor">B Minor</div>
                  </div>
                </div>
                <input type="hidden" id="beatKey" value="">
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Pricing with File Types -->
        <div class="upload-step" id="upload-content-4">
          <h4 style="text-align: center; margin-bottom: 20px;">Set your prices & included files</h4>
          <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
            <!-- Basic Tier -->
            <div class="pricing-tier enabled" id="tierBasic" onclick="togglePricingTier('Basic')">
              <div class="pricing-tier-header">
                <input type="checkbox" class="pricing-tier-checkbox" id="tierBasicEnabled" checked onclick="event.stopPropagation(); togglePricingTier('Basic')">
                <span style="font-weight: 600;">Basic Lease</span>
              </div>
              <div class="price-input-wrapper">
                <span style="font-size: 20px;"><i data-lucide="dollar-sign" style="width:20px;height:20px;"></i></span>
                <input type="text" inputmode="numeric" class="form-input price-input" id="beatPriceBasic" value="30" onclick="event.stopPropagation()">
              </div>
              <div class="file-type-checkboxes" onclick="event.stopPropagation()">
                <label><input type="checkbox" id="basicMp3" checked disabled> MP3</label>
              </div>
            </div>

            <!-- Premium Tier -->
            <div class="pricing-tier" id="tierPremium" onclick="togglePricingTier('Premium')">
              <div class="pricing-tier-header">
                <input type="checkbox" class="pricing-tier-checkbox" id="tierPremiumEnabled" onclick="event.stopPropagation(); togglePricingTier('Premium')">
                <span style="font-weight: 600;">Premium</span>
              </div>
              <div class="price-input-wrapper">
                <span style="font-size: 20px;"><i data-lucide="dollar-sign" style="width:20px;height:20px;"></i></span>
                <input type="text" inputmode="numeric" class="form-input price-input" id="beatPricePremium" placeholder="100" onclick="event.stopPropagation()">
              </div>
              <div class="file-type-checkboxes" onclick="event.stopPropagation()">
                <label><input type="checkbox" id="premiumMp3" checked disabled> MP3</label>
                <label><input type="checkbox" id="premiumWav" checked> WAV</label>
              </div>
            </div>

            <!-- Exclusive Tier -->
            <div class="pricing-tier" id="tierExclusive" onclick="togglePricingTier('Exclusive')">
              <div class="pricing-tier-header">
                <input type="checkbox" class="pricing-tier-checkbox" id="tierExclusiveEnabled" onclick="event.stopPropagation(); togglePricingTier('Exclusive')">
                <span style="font-weight: 600;">Exclusive</span>
              </div>
              <div class="price-input-wrapper">
                <span style="font-size: 20px;"><i data-lucide="dollar-sign" style="width:20px;height:20px;"></i></span>
                <input type="text" inputmode="numeric" class="form-input price-input" id="beatPriceExclusive" placeholder="500" onclick="event.stopPropagation()">
              </div>
              <div class="file-type-checkboxes" onclick="event.stopPropagation()">
                <label><input type="checkbox" id="exclusiveMp3" checked disabled> MP3</label>
                <label><input type="checkbox" id="exclusiveWav" checked> WAV</label>
                <label><input type="checkbox" id="exclusiveStems" checked> Stems</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4b: Additional Files Upload (conditional) -->
        <div class="upload-step" id="upload-content-4b" style="display: none;">
          <h4 style="text-align: center; margin-bottom: 20px;">Upload Additional Files</h4>
          <p style="text-align: center; color: var(--gray-dark); margin-bottom: 24px; font-size: 14px;">
            Upload the high-quality files for your selected tiers
          </p>
          <div id="additionalFilesContainer">
            <!-- WAV Upload -->
            <div id="wavUploadSection" style="margin-bottom: 24px; display: none;">
              <label style="display: block; font-weight: 600; margin-bottom: 8px;">WAV File</label>
              <div class="file-upload-zone" onclick="document.getElementById('wavFileInput').click()" style="border: 2px dashed var(--gray-medium); border-radius: 8px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s;">
                <input type="file" id="wavFileInput" accept=".wav" style="display: none;">
                <i data-lucide="file-audio" style="width: 32px; height: 32px; color: var(--gray-dark);"></i>
                <div style="margin-top: 8px; font-size: 14px;" id="wavFileName">Click to upload WAV file</div>
              </div>
            </div>
            <!-- Stems Upload -->
            <div id="stemsUploadSection" style="display: none;">
              <label style="display: block; font-weight: 600; margin-bottom: 8px;">Stems (ZIP file)</label>
              <div class="file-upload-zone" onclick="document.getElementById('stemsFileInput').click()" style="border: 2px dashed var(--gray-medium); border-radius: 8px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s;">
                <input type="file" id="stemsFileInput" accept=".zip" style="display: none;">
                <i data-lucide="folder-archive" style="width: 32px; height: 32px; color: var(--gray-dark);"></i>
                <div style="margin-top: 8px; font-size: 14px;" id="stemsFileName">Click to upload Stems (ZIP)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5: Preview Selection with Waveform Editor -->
        <div class="upload-step" id="upload-content-5">
          <h4 style="text-align: center; margin-bottom: 20px;">Set Preview Range</h4>
          <p style="text-align: center; color: var(--gray-dark); font-size: 14px; margin-bottom: 16px;">
            Drag the markers to select which section will be used as the preview
          </p>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <!-- Play Button -->
            <button type="button" id="previewPlayBtn" onclick="togglePreviewPlayback()" style="width: 48px; height: 48px; border-radius: 50%; background: var(--red); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.2s, background 0.2s;">
              <i data-lucide="play" id="previewPlayIcon" style="width: 24px; height: 24px; color: white; margin-left: 2px;"></i>
            </button>
            <div id="waveformContainer" style="flex: 1; position: relative; background: var(--gray-light); border-radius: 8px; padding: 16px;">
            <canvas id="waveformCanvas" style="width: 100%; height: 100px; display: block;"></canvas>
            <!-- Start Marker -->
            <div id="startMarker" style="position: absolute; top: 16px; bottom: 16px; width: 4px; background: #10B981; cursor: ew-resize; border-radius: 2px;">
              <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: #10B981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; white-space: nowrap;" id="startTimeLabel">0:00</div>
            </div>
            <!-- End Marker -->
            <div id="endMarker" style="position: absolute; top: 16px; bottom: 16px; width: 4px; background: var(--red); cursor: ew-resize; border-radius: 2px;">
              <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: var(--red); color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; white-space: nowrap;" id="endTimeLabel">0:30</div>
            </div>
            <!-- Selected Region Overlay -->
            <div id="selectedRegion" style="position: absolute; top: 16px; bottom: 16px; background: rgba(220, 38, 38, 0.15); pointer-events: none;"></div>
          </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--gray-dark); padding: 0 60px 0 8px;">
            <span>0:00</span>
            <span id="totalDuration">--:--</span>
          </div>
          <div style="text-align: center; margin-top: 16px; font-size: 14px;">
            <span style="color: var(--gray-dark);">Preview: </span>
            <span style="font-weight: 600;" id="previewDurationText">30 seconds</span>
            <span style="color: var(--gray-dark);"> (from </span>
            <span style="font-weight: 600;" id="previewRangeText">0:00 to 0:30</span>
            <span style="color: var(--gray-dark);">)</span>
          </div>
          <!-- Hidden inputs for form data -->
          <input type="hidden" id="previewStart" value="0">
          <input type="hidden" id="previewEnd" value="30">
        </div>

        <!-- Step 6: Review & Upload -->
        <div class="upload-step" id="upload-content-6">
          <h4 style="text-align: center; margin-bottom: 20px;">Review & Upload</h4>
          <div style="display: flex; gap: 20px; align-items: flex-start;">
            <img id="reviewCover" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23667eea'/%3E%3Ctext x='60' y='68' text-anchor='middle' font-family='system-ui' font-size='36' fill='white'%3E♪%3C/text%3E%3C/svg%3E" style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover;">
            <div style="flex: 1;">
              <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;" id="reviewTitle">--</div>
              <div style="color: var(--gray-dark); margin-bottom: 4px;" id="reviewGenre">Genre: --</div>
              <div style="color: var(--gray-dark); margin-bottom: 4px;" id="reviewBpmKey">-- BPM • --</div>
              <div style="color: var(--red); font-weight: 600;" id="reviewPrice">$--</div>
            </div>
          </div>
          <div id="uploadProgress" style="display: none; margin-top: 24px;">
            <div style="background: var(--gray-light); border-radius: 8px; height: 8px; overflow: hidden;">
              <div id="uploadProgressBar" style="background: var(--red); height: 100%; width: 0%; transition: width 0.3s;"></div>
            </div>
            <p style="text-align: center; margin-top: 8px; color: var(--gray-dark);" id="uploadStatus">Uploading...</p>
          </div>
          <div id="uploadError" style="margin-top: 16px;"></div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="uploadPrevBtn" onclick="uploadPrevStep()" style="visibility: hidden;">Back</button>
        <button class="btn btn-primary" id="uploadNextBtn" onclick="uploadNextStep()">Next</button>
      </div>
    </div>

    <style>
      .upload-step-indicator {
        width: 32px; height: 32px; border-radius: 50%;
        background: var(--gray-medium); color: var(--gray-dark);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 600; transition: all 0.3s;
      }
      .upload-step-indicator.active { background: var(--red); color: white; }
      .upload-step-indicator.completed { background: #10B981; color: white; }
      .upload-step { display: none; animation: fadeIn 0.3s; }
      .upload-step.active { display: block; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      /* Custom Dropdown Styles */
      .custom-dropdown { position: relative; width: 100%; }
      .custom-dropdown-selected {
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px 16px; background: #1a1a1a; color: #fff;
        border: 1px solid #333; border-radius: 8px; cursor: pointer;
        transition: all 0.2s;
      }
      .custom-dropdown-selected:hover { border-color: #555; }
      .custom-dropdown.open .custom-dropdown-selected { border-color: var(--red); }
      .custom-dropdown-options {
        position: absolute; top: 100%; left: 0; right: 0;
        background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
        margin-top: 4px; max-height: 200px; overflow-y: auto;
        opacity: 0; visibility: hidden; transform: translateY(-8px);
        transition: all 0.2s; z-index: 100;
      }
      .custom-dropdown.open .custom-dropdown-options {
        opacity: 1; visibility: visible; transform: translateY(0);
      }
      .custom-dropdown-option {
        padding: 10px 16px; cursor: pointer; transition: background 0.2s; color: #ccc;
      }
      .custom-dropdown-option:hover { background: #2a2a2a; color: #fff; }
      .custom-dropdown-option.selected { background: var(--red); color: #fff; }

      /* BPM Input - No Arrows */
      .bpm-input { -webkit-appearance: none; -moz-appearance: textfield; }
      .bpm-input::-webkit-outer-spin-button,
      .bpm-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

      /* Pricing Tier Cards */
      .pricing-tier {
        flex: 1; min-width: 160px; padding: 20px;
        border: 2px solid var(--gray-medium); border-radius: 12px;
        text-align: center; cursor: pointer; transition: all 0.2s; opacity: 0.6;
      }
      .pricing-tier.enabled { opacity: 1; border-color: var(--red); }
      .pricing-tier-header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px; }
      .pricing-tier-checkbox { width: 18px; height: 18px; accent-color: var(--red); cursor: pointer; }
      .file-type-checkboxes { margin-top: 12px; text-align: left; font-size: 13px; }
      .file-type-checkboxes label { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; cursor: pointer; }
      .price-input-wrapper { display: flex; align-items: center; justify-content: center; gap: 4px; }
      .price-input {
        width: 80px; text-align: center; font-size: 18px; padding: 8px;
        -webkit-appearance: none; -moz-appearance: textfield;
      }
      .price-input::-webkit-outer-spin-button,
      .price-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

      /* Shake animation for validation feedback */
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      /* Enhanced pricing tier hover */
      .pricing-tier:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .pricing-tier.enabled { background: rgba(220, 38, 38, 0.05); }
    </style>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
  initDropdownHandlers();

  // File handlers
  document.getElementById('beatCoverArt').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadState.coverFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('coverPreviewImg').src = e.target.result;
        document.getElementById('coverPreviewImg').style.display = 'block';
        document.getElementById('coverPlaceholder').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('beatAudioFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File too large. Max 50MB allowed.');
        return;
      }
      uploadState.audioFile = file;
      document.getElementById('audioPlaceholder').style.display = 'none';
      document.getElementById('audioFileName').style.display = 'block';
      document.getElementById('audioFileName').innerHTML = '<i data-lucide="check-circle" style="width:16px;height:16px;color:#10B981;vertical-align:middle;margin-right:4px;"></i> ' + file.name;
      lucide.createIcons();
    }
  });

  // Preview type handlers
  document.querySelectorAll('input[name="previewType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      uploadState.previewType = e.target.value;
      document.querySelectorAll('#preview-30, #preview-60, #preview-full').forEach(l => l.style.borderColor = 'var(--gray-medium)');
      document.getElementById('preview-' + e.target.value).style.borderColor = 'var(--red)';
      document.getElementById('previewRangeContainer').style.display = e.target.value !== 'full' ? 'block' : 'none';
      if (e.target.value !== 'full') {
        document.getElementById('previewEnd').value = parseInt(e.target.value);
      }
    });
  });
}

function updateUploadSteps() {
  for (let i = 1; i <= 6; i++) {
    const indicator = document.getElementById('upload-step-' + i);
    const content = document.getElementById('upload-content-' + i);
    indicator.classList.remove('active', 'completed');
    content.classList.remove('active');
    if (i < uploadState.step) {
      indicator.classList.add('completed');
      indicator.innerHTML = '<i data-lucide="check" style="width:16px;height:16px;"></i>';
    } else if (i === uploadState.step) {
      indicator.classList.add('active');
      indicator.textContent = i;
      content.classList.add('active');
    } else {
      indicator.textContent = i;
    }
  }
  lucide.createIcons();

  document.getElementById('uploadPrevBtn').style.visibility = uploadState.step === 1 ? 'hidden' : 'visible';
  document.getElementById('uploadNextBtn').textContent = uploadState.step === 6 ? 'Upload Beat' : 'Next';
}

function needsAdditionalFiles() {
  // Check if any tier has WAV or Stems checked
  const premiumWav = document.getElementById('premiumWav')?.checked;
  const exclusiveWav = document.getElementById('exclusiveWav')?.checked;
  const exclusiveStems = document.getElementById('exclusiveStems')?.checked;
  return premiumWav || exclusiveWav || exclusiveStems;
}

function setupAdditionalFilesStep() {
  const wavSection = document.getElementById('wavUploadSection');
  const stemsSection = document.getElementById('stemsUploadSection');

  const premiumWav = document.getElementById('premiumWav')?.checked;
  const exclusiveWav = document.getElementById('exclusiveWav')?.checked;
  const exclusiveStems = document.getElementById('exclusiveStems')?.checked;

  wavSection.style.display = (premiumWav || exclusiveWav) ? 'block' : 'none';
  stemsSection.style.display = exclusiveStems ? 'block' : 'none';

  // Setup file input handlers
  document.getElementById('wavFileInput').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadState.wavFile = file;
      document.getElementById('wavFileName').textContent = file.name;
    }
  };

  document.getElementById('stemsFileInput').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadState.stemsFile = file;
      document.getElementById('stemsFileName').textContent = file.name;
    }
  };
}

function uploadNextStep() {
  // Validate current step
  if (uploadState.step === 1) {
    uploadState.title = document.getElementById('beatTitle').value.trim();
    if (!uploadState.title) { alert('Please enter a beat title'); return; }
    if (!uploadState.coverFile) { alert('Please upload cover art'); return; }
  } else if (uploadState.step === 2) {
    if (!uploadState.audioFile) { alert('Please upload an audio file'); return; }
    uploadState.genre = document.getElementById('beatGenre').value;
  } else if (uploadState.step === 3) {
    uploadState.bpm = document.getElementById('beatBpm').value;
    uploadState.key = document.getElementById('beatKey').value;
  } else if (uploadState.step === 4) {
    uploadState.priceBasic = parseInt(document.getElementById('beatPriceBasic').value) || 30;
    uploadState.pricePremium = document.getElementById('beatPricePremium').value ? parseInt(document.getElementById('beatPricePremium').value) : null;
    uploadState.priceExclusive = document.getElementById('beatPriceExclusive').value ? parseInt(document.getElementById('beatPriceExclusive').value) : null;

    // Check if we need to show additional files step
    if (needsAdditionalFiles()) {
      uploadState.step = '4b';
      document.querySelectorAll('.upload-step').forEach(s => s.classList.remove('active'));
      document.getElementById('upload-content-4b').classList.add('active');
      document.getElementById('upload-content-4b').style.display = 'block';
      setupAdditionalFilesStep();
      lucide.createIcons();
      return;
    }
  } else if (uploadState.step === '4b') {
    // Validate WAV file if needed
    const premiumWav = document.getElementById('premiumWav')?.checked;
    const exclusiveWav = document.getElementById('exclusiveWav')?.checked;
    const exclusiveStems = document.getElementById('exclusiveStems')?.checked;

    if ((premiumWav || exclusiveWav) && !uploadState.wavFile) {
      alert('Please upload a WAV file for the selected tiers');
      return;
    }
    if (exclusiveStems && !uploadState.stemsFile) {
      alert('Please upload stems (ZIP) for the exclusive tier');
      return;
    }

    uploadState.step = 5;
    document.getElementById('upload-content-4b').classList.remove('active');
    updateUploadSteps();
    return;
  } else if (uploadState.step === 5) {
    uploadState.previewStart = parseInt(document.getElementById('previewStart').value) || 0;
    uploadState.previewEnd = parseInt(document.getElementById('previewEnd').value) || 30;
  }

  if (uploadState.step < 6) {
    uploadState.step++;
    updateUploadSteps();

    // Step 3: Run BPM detection
    if (uploadState.step === 3) {
      analyzeBeat();
    }

    // Step 5: Initialize waveform editor
    if (uploadState.step === 5) {
      setTimeout(() => initWaveformEditor(), 100);
    }

    // Step 6: Update review
    if (uploadState.step === 6) {
      updateReview();
    }
  } else {
    uploadBeat();
  }
}

function uploadPrevStep() {
  if (uploadState.step === '4b') {
    // Go back from additional files to pricing
    uploadState.step = 4;
    document.getElementById('upload-content-4b').classList.remove('active');
    document.getElementById('upload-content-4b').style.display = 'none';
    updateUploadSteps();
  } else if (uploadState.step === 5 && needsAdditionalFiles()) {
    // If going back from preview and we had additional files, go to 4b
    uploadState.step = '4b';
    document.querySelectorAll('.upload-step').forEach(s => s.classList.remove('active'));
    document.getElementById('upload-content-4b').classList.add('active');
    document.getElementById('upload-content-4b').style.display = 'block';
    setupAdditionalFilesStep();
    lucide.createIcons();
  } else if (uploadState.step > 1) {
    uploadState.step--;
    updateUploadSteps();
  }
}

// BP-011: Simple BPM detection using Web Audio API
async function analyzeBeat() {
  const loading = document.getElementById('analysisLoading');
  const results = document.getElementById('analysisResults');
  loading.style.display = 'block';
  results.style.display = 'none';

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await uploadState.audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Store for waveform drawing
    uploadState.audioBuffer = audioBuffer;
    uploadState.audioDuration = audioBuffer.duration;

    // Simple BPM detection
    const bpm = await detectBPM(audioBuffer, audioContext);
    const key = detectKey(audioBuffer);

    document.getElementById('detectedBpm').textContent = bpm || '?';
    document.getElementById('detectedKey').textContent = key || '?';
    document.getElementById('beatBpm').value = bpm || '';
    document.getElementById('beatKey').value = key || '';

    uploadState.bpm = bpm;
    uploadState.key = key;

  } catch (e) {
    console.error('Analysis error:', e);
    document.getElementById('detectedBpm').textContent = '?';
    document.getElementById('detectedKey').textContent = '?';
  }

  loading.style.display = 'none';
  results.style.display = 'block';
}

// Preview playback
let previewAudioElement = null;
let previewPlaying = false;

function togglePreviewPlayback() {
  if (!uploadState.audioFile) return;

  const playBtn = document.getElementById('previewPlayBtn');
  const playIcon = document.getElementById('previewPlayIcon');

  if (previewPlaying && previewAudioElement) {
    previewAudioElement.pause();
    previewPlaying = false;
    playIcon.setAttribute('data-lucide', 'play');
    playIcon.style.marginLeft = '2px';
    lucide.createIcons();
    return;
  }

  // Create audio element if needed
  if (!previewAudioElement) {
    previewAudioElement = new Audio();
    previewAudioElement.src = URL.createObjectURL(uploadState.audioFile);

    previewAudioElement.addEventListener('timeupdate', () => {
      if (previewAudioElement.currentTime >= uploadState.previewEnd) {
        previewAudioElement.pause();
        previewPlaying = false;
        document.getElementById('previewPlayIcon').setAttribute('data-lucide', 'play');
        document.getElementById('previewPlayIcon').style.marginLeft = '2px';
        lucide.createIcons();
      }
    });

    previewAudioElement.addEventListener('ended', () => {
      previewPlaying = false;
      document.getElementById('previewPlayIcon').setAttribute('data-lucide', 'play');
      document.getElementById('previewPlayIcon').style.marginLeft = '2px';
      lucide.createIcons();
    });
  }

  // Start from preview start position
  previewAudioElement.currentTime = uploadState.previewStart || 0;
  previewAudioElement.play();
  previewPlaying = true;
  playIcon.setAttribute('data-lucide', 'pause');
  playIcon.style.marginLeft = '0';
  lucide.createIcons();
}

// Waveform drawing and preview marker functionality
function initWaveformEditor() {
  const canvas = document.getElementById('waveformCanvas');
  if (!canvas || !uploadState.audioBuffer) return;

  const ctx = canvas.getContext('2d');
  const container = document.getElementById('waveformContainer');
  const containerRect = container.getBoundingClientRect();
  const padding = 16;

  // Set canvas dimensions
  canvas.width = containerRect.width - (padding * 2);
  canvas.height = 100;

  // Draw waveform
  const audioBuffer = uploadState.audioBuffer;
  const channelData = audioBuffer.getChannelData(0);
  const duration = audioBuffer.duration;
  const samplesPerPixel = Math.floor(channelData.length / canvas.width);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'var(--red)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  const centerY = canvas.height / 2;

  for (let x = 0; x < canvas.width; x++) {
    const start = x * samplesPerPixel;
    const end = Math.min(start + samplesPerPixel, channelData.length);
    let min = 0, max = 0;

    for (let i = start; i < end; i++) {
      if (channelData[i] < min) min = channelData[i];
      if (channelData[i] > max) max = channelData[i];
    }

    const minY = centerY + (min * centerY * 0.9);
    const maxY = centerY + (max * centerY * 0.9);

    ctx.moveTo(x, minY);
    ctx.lineTo(x, maxY);
  }

  ctx.stroke();

  // Update total duration display
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  document.getElementById('totalDuration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Initialize markers
  const startMarker = document.getElementById('startMarker');
  const endMarker = document.getElementById('endMarker');
  const selectedRegion = document.getElementById('selectedRegion');

  // Set default end to 30 seconds or full duration
  const defaultEnd = Math.min(30, duration);
  uploadState.previewStart = 0;
  uploadState.previewEnd = defaultEnd;

  // Position markers
  const availableWidth = containerRect.width - (padding * 2);
  startMarker.style.left = `${padding}px`;
  endMarker.style.left = `${padding + (defaultEnd / duration) * availableWidth}px`;

  updatePreviewRegion();
  setupMarkerDragging();
}

function updatePreviewRegion() {
  const container = document.getElementById('waveformContainer');
  const containerRect = container.getBoundingClientRect();
  const padding = 16;
  const availableWidth = containerRect.width - (padding * 2);
  const duration = uploadState.audioDuration || 180;

  const startMarker = document.getElementById('startMarker');
  const endMarker = document.getElementById('endMarker');
  const selectedRegion = document.getElementById('selectedRegion');

  const startLeft = parseFloat(startMarker.style.left) || padding;
  const endLeft = parseFloat(endMarker.style.left) || (padding + availableWidth * 0.2);

  selectedRegion.style.left = `${startLeft}px`;
  selectedRegion.style.width = `${endLeft - startLeft}px`;

  // Calculate times
  const startTime = ((startLeft - padding) / availableWidth) * duration;
  const endTime = ((endLeft - padding) / availableWidth) * duration;

  uploadState.previewStart = Math.max(0, Math.round(startTime));
  uploadState.previewEnd = Math.min(Math.round(duration), Math.round(endTime));

  // Update hidden inputs
  document.getElementById('previewStart').value = uploadState.previewStart;
  document.getElementById('previewEnd').value = uploadState.previewEnd;

  // Update labels
  const formatTime = (t) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  document.getElementById('startTimeLabel').textContent = formatTime(startTime);
  document.getElementById('endTimeLabel').textContent = formatTime(endTime);

  const previewDuration = Math.max(0, uploadState.previewEnd - uploadState.previewStart);
  document.getElementById('previewDurationText').textContent = `${previewDuration} seconds`;
  document.getElementById('previewRangeText').textContent = `${formatTime(uploadState.previewStart)} to ${formatTime(uploadState.previewEnd)}`;
}

function setupMarkerDragging() {
  const container = document.getElementById('waveformContainer');
  const padding = 16;
  let activeMarker = null;
  let isOtherMarker = null;

  const onMouseDown = (e) => {
    if (e.target.id === 'startMarker' || e.target.closest('#startMarker')) {
      activeMarker = document.getElementById('startMarker');
      isOtherMarker = document.getElementById('endMarker');
    } else if (e.target.id === 'endMarker' || e.target.closest('#endMarker')) {
      activeMarker = document.getElementById('endMarker');
      isOtherMarker = document.getElementById('startMarker');
    }
    if (activeMarker) {
      e.preventDefault();
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onMouseMove = (e) => {
    if (!activeMarker) return;

    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - (padding * 2);
    let newLeft = e.clientX - containerRect.left;

    // Constrain to container bounds
    newLeft = Math.max(padding, Math.min(containerRect.width - padding, newLeft));

    // Prevent markers from crossing
    const otherLeft = parseFloat(isOtherMarker.style.left) || 0;
    if (activeMarker.id === 'startMarker') {
      newLeft = Math.min(newLeft, otherLeft - 10);
    } else {
      newLeft = Math.max(newLeft, otherLeft + 10);
    }

    activeMarker.style.left = `${newLeft}px`;
    updatePreviewRegion();
  };

  const onMouseUp = () => {
    activeMarker = null;
    isOtherMarker = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  container.addEventListener('mousedown', onMouseDown);

  // Touch support
  container.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    onMouseDown({ target: document.elementFromPoint(touch.clientX, touch.clientY), clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
  });
  container.addEventListener('touchmove', (e) => {
    if (activeMarker) {
      const touch = e.touches[0];
      onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
  });
  container.addEventListener('touchend', onMouseUp);
}

async function detectBPM(audioBuffer, audioContext) {
  // Improved BPM detection using energy-based autocorrelation
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Use a portion of the audio (middle section, up to 30 seconds)
  const startSample = Math.floor(channelData.length * 0.1);
  const maxSamples = Math.min(sampleRate * 30, channelData.length - startSample);

  // Create low-pass filtered version (isolate bass/kick)
  const filterSize = Math.floor(sampleRate / 200); // ~200Hz cutoff
  const filtered = [];
  for (let i = startSample; i < startSample + maxSamples; i++) {
    let sum = 0;
    const start = Math.max(0, i - filterSize);
    const end = Math.min(channelData.length, i + filterSize);
    for (let j = start; j < end; j++) {
      sum += channelData[j] * channelData[j]; // Square for energy
    }
    filtered.push(sum / (end - start));
  }

  // Downsample energy envelope for faster processing
  const windowSize = Math.floor(sampleRate / 20); // 50ms windows
  const energyEnvelope = [];
  for (let i = 0; i < filtered.length; i += windowSize) {
    let sum = 0;
    const count = Math.min(windowSize, filtered.length - i);
    for (let j = 0; j < count; j++) {
      sum += filtered[i + j];
    }
    energyEnvelope.push(sum / count);
  }

  // Autocorrelation to find periodic patterns
  // BPM range: 60-200 BPM -> periods of 0.3s to 1s -> envelope samples
  const minLag = Math.floor(60 / (200 * (windowSize / sampleRate))); // 200 BPM
  const maxLag = Math.floor(60 / (60 * (windowSize / sampleRate)));  // 60 BPM

  let bestLag = minLag;
  let bestCorrelation = -Infinity;

  for (let lag = minLag; lag <= Math.min(maxLag, energyEnvelope.length / 2); lag++) {
    let correlation = 0;
    let count = 0;
    for (let i = 0; i < energyEnvelope.length - lag; i++) {
      correlation += energyEnvelope[i] * energyEnvelope[i + lag];
      count++;
    }
    correlation /= count;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  // Convert lag to BPM
  const secondsPerBeat = (bestLag * windowSize) / sampleRate;
  let bpm = Math.round(60 / secondsPerBeat);

  // Normalize to common range (70-180 BPM typical for beats)
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;

  // Round to nearest common BPM value
  const commonBPMs = [70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180];
  const closest = commonBPMs.reduce((prev, curr) =>
    Math.abs(curr - bpm) < Math.abs(prev - bpm) ? curr : prev
  );

  return closest;
}

function detectKey(audioBuffer) {
  // Key detection using chromagram analysis and Krumhansl-Schmuckler profiles
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Chromagram - sum of energy in each of 12 pitch classes
  const chroma = new Array(12).fill(0);

  // Use middle portion of audio
  const startSample = Math.floor(channelData.length * 0.1);
  const endSample = Math.min(startSample + sampleRate * 20, channelData.length);

  // Simple frequency detection using zero crossings and energy in frequency bands
  // We'll approximate pitch class distribution
  const frameSize = 4096;
  const hopSize = 2048;

  for (let i = startSample; i < endSample - frameSize; i += hopSize) {
    // Apply Hann window and calculate simple spectrum energy
    const frame = [];
    for (let j = 0; j < frameSize; j++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * j / frameSize));
      frame.push(channelData[i + j] * window);
    }

    // Simple DFT for key frequencies (we only need certain frequency bins)
    // Map each pitch class to its fundamental and harmonics
    const pitchFreqs = [
      261.63, 277.18, 293.66, 311.13, 329.63, 349.23, // C, C#, D, D#, E, F
      369.99, 392.00, 415.30, 440.00, 466.16, 493.88  // F#, G, G#, A, A#, B
    ];

    for (let pc = 0; pc < 12; pc++) {
      // Check multiple octaves
      for (let octave = 0; octave < 4; octave++) {
        const freq = pitchFreqs[pc] * Math.pow(2, octave - 1);
        if (freq > sampleRate / 2) continue;

        // Goertzel algorithm for specific frequency
        const k = Math.round(freq * frameSize / sampleRate);
        const w = 2 * Math.PI * k / frameSize;
        const coeff = 2 * Math.cos(w);

        let s0 = 0, s1 = 0, s2 = 0;
        for (let j = 0; j < frameSize; j++) {
          s0 = frame[j] + coeff * s1 - s2;
          s2 = s1;
          s1 = s0;
        }

        const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
        chroma[pc] += Math.sqrt(Math.abs(power));
      }
    }
  }

  // Normalize chroma
  const maxChroma = Math.max(...chroma);
  if (maxChroma > 0) {
    for (let i = 0; i < 12; i++) {
      chroma[i] /= maxChroma;
    }
  }

  // Krumhansl-Schmuckler key profiles
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

  const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  let bestKey = 'C Major';
  let bestScore = -Infinity;

  // Try all 24 keys (12 major + 12 minor)
  for (let root = 0; root < 12; root++) {
    // Rotate chroma to align with current root
    const rotatedChroma = [];
    for (let i = 0; i < 12; i++) {
      rotatedChroma.push(chroma[(i + root) % 12]);
    }

    // Correlation with major profile
    let majorScore = 0;
    let chromaSum = 0, profileSum = 0;
    for (let i = 0; i < 12; i++) {
      majorScore += rotatedChroma[i] * majorProfile[i];
      chromaSum += rotatedChroma[i] * rotatedChroma[i];
      profileSum += majorProfile[i] * majorProfile[i];
    }
    majorScore /= Math.sqrt(chromaSum * profileSum) || 1;

    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestKey = keyNames[root] + ' Major';
    }

    // Correlation with minor profile
    let minorScore = 0;
    profileSum = 0;
    for (let i = 0; i < 12; i++) {
      minorScore += rotatedChroma[i] * minorProfile[i];
      profileSum += minorProfile[i] * minorProfile[i];
    }
    minorScore /= Math.sqrt(chromaSum * profileSum) || 1;

    if (minorScore > bestScore) {
      bestScore = minorScore;
      bestKey = keyNames[root] + ' Minor';
    }
  }

  return bestKey;
}

function updateReview() {
  if (uploadState.coverFile) {
    const reader = new FileReader();
    reader.onload = (e) => document.getElementById('reviewCover').src = e.target.result;
    reader.readAsDataURL(uploadState.coverFile);
  }
  document.getElementById('reviewTitle').textContent = uploadState.title;
  document.getElementById('reviewGenre').textContent = 'Genre: ' + (uploadState.genre || 'Not specified');
  document.getElementById('reviewBpmKey').textContent = (uploadState.bpm || '?') + ' BPM • ' + (uploadState.key || 'Unknown key');
  document.getElementById('reviewPrice').textContent = '$' + uploadState.priceBasic;
}

function closeUploadModal() {
  document.getElementById('uploadModal')?.remove();
}

// BEAT-018: Bulk Upload functionality
let bulkUploadFiles = [];
let bulkUploadProgress = 0;

function openBulkUploadModal() {
  bulkUploadFiles = [];
  bulkUploadProgress = 0;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'bulkUploadModal';
  modal.innerHTML = `
    <div class="modal-content large" style="max-width: 900px; max-height: 90vh;">
      <div class="modal-header">
        <h3 class="modal-title">Bulk Upload Beats</h3>
        <button class="modal-close" onclick="closeBulkUploadModal()">×</button>
      </div>

      <div class="modal-body" style="overflow-y: auto; max-height: 60vh;">
        <!-- Drop Zone -->
        <div id="bulkDropZone" class="bulk-drop-zone" style="border: 2px dashed #E5E7EB; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 20px; cursor: pointer; transition: all 0.2s;">
          <div style="margin-bottom: 12px;"><i data-lucide="folder-up" style="width:48px;height:48px;color:var(--gray-dark);"></i></div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Drop audio files or folder here</div>
          <div style="color: #6B7280;">or click to browse</div>
          <input type="file" id="bulkFileInput" accept="audio/*" multiple webkitdirectory style="display: none;">
        </div>

        <!-- Global Settings -->
        <div id="bulkGlobalSettings" style="display: none; padding: 16px; background: #F9FAFB; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin-bottom: 12px; font-size: 14px;">Apply to All Beats</h4>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
            <div>
              <label style="font-size: 12px; color: #6B7280;">Genre</label>
              <select class="form-input" id="bulkGenre" style="font-size: 13px;">
                <option value="">Select...</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Trap">Trap</option>
                <option value="R&B">R&B</option>
                <option value="Pop">Pop</option>
                <option value="Drill">Drill</option>
                <option value="Afrobeat">Afrobeat</option>
                <option value="Lo-Fi">Lo-Fi</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style="font-size: 12px; color: #6B7280;">Basic Price ($)</label>
              <input type="number" class="form-input" id="bulkPriceBasic" value="30" min="1" style="font-size: 13px;">
            </div>
            <div>
              <label style="font-size: 12px; color: #6B7280;">Premium Price ($)</label>
              <input type="number" class="form-input" id="bulkPricePremium" placeholder="Optional" style="font-size: 13px;">
            </div>
            <div>
              <label style="font-size: 12px; color: #6B7280;">Exclusive Price ($)</label>
              <input type="number" class="form-input" id="bulkPriceExclusive" placeholder="Optional" style="font-size: 13px;">
            </div>
          </div>
          <button class="btn btn-secondary" style="margin-top: 12px;" onclick="applyBulkSettings()">Apply to All</button>
        </div>

        <!-- Files Grid -->
        <div id="bulkFilesGrid" style="display: none;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #F3F4F6;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB;">Title</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; width: 80px;">BPM</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; width: 80px;">Key</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; width: 100px;">Genre</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; width: 80px;">Price</th>
                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #E5E7EB; width: 60px;">Status</th>
              </tr>
            </thead>
            <tbody id="bulkFilesTableBody"></tbody>
          </table>
        </div>

        <!-- Progress Bar -->
        <div id="bulkProgressContainer" style="display: none; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Uploading...</span>
            <span id="bulkProgressText">0%</span>
          </div>
          <div style="background: #E5E7EB; border-radius: 8px; height: 8px; overflow: hidden;">
            <div id="bulkProgressBar" style="background: var(--red); height: 100%; width: 0%; transition: width 0.3s;"></div>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; padding: 16px; border-top: 1px solid #E5E7EB;">
        <button class="btn btn-secondary" onclick="closeBulkUploadModal()">Cancel</button>
        <button class="btn btn-primary" id="bulkUploadBtn" onclick="startBulkUpload()" disabled>
          Upload All Beats (<span id="bulkFileCount">0</span>)
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  lucide.createIcons();

  // Set up event listeners
  const dropZone = document.getElementById('bulkDropZone');
  const fileInput = document.getElementById('bulkFileInput');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--red)';
    dropZone.style.background = '#FEF2F2';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#E5E7EB';
    dropZone.style.background = 'transparent';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#E5E7EB';
    dropZone.style.background = 'transparent';
    handleBulkFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => handleBulkFiles(e.target.files));
}

function closeBulkUploadModal() {
  document.getElementById('bulkUploadModal')?.remove();
  bulkUploadFiles = [];
}

function handleBulkFiles(files) {
  const audioFiles = Array.from(files).filter(f => f.type.startsWith('audio/'));

  audioFiles.forEach(file => {
    const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    bulkUploadFiles.push({
      file: file,
      title: fileName,
      bpm: null,
      key: null,
      genre: '',
      priceBasic: 30,
      pricePremium: null,
      priceExclusive: null,
      status: 'pending'
    });
  });

  if (bulkUploadFiles.length > 0) {
    document.getElementById('bulkGlobalSettings').style.display = 'block';
    document.getElementById('bulkFilesGrid').style.display = 'block';
    document.getElementById('bulkUploadBtn').disabled = false;
    document.getElementById('bulkFileCount').textContent = bulkUploadFiles.length;
    renderBulkFilesGrid();

    // Auto-detect BPM/Key for each file
    bulkUploadFiles.forEach((item, index) => detectBulkBpmKey(item, index));
  }
}

function renderBulkFilesGrid() {
  const tbody = document.getElementById('bulkFilesTableBody');
  tbody.innerHTML = bulkUploadFiles.map((item, index) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">
        <input type="text" class="form-input" value="${item.title}" style="font-size: 12px; padding: 6px 8px;" onchange="bulkUploadFiles[${index}].title = this.value">
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">
        <input type="number" class="form-input" value="${item.bpm || ''}" placeholder="..." style="font-size: 12px; padding: 6px 8px; width: 60px;" onchange="bulkUploadFiles[${index}].bpm = parseInt(this.value)">
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">
        <select class="form-input" style="font-size: 12px; padding: 6px 4px; width: 70px;" onchange="bulkUploadFiles[${index}].key = this.value">
          <option value="">...</option>
          <option value="C" ${item.key === 'C' ? 'selected' : ''}>C</option>
          <option value="C#" ${item.key === 'C#' ? 'selected' : ''}>C#</option>
          <option value="D" ${item.key === 'D' ? 'selected' : ''}>D</option>
          <option value="D#" ${item.key === 'D#' ? 'selected' : ''}>D#</option>
          <option value="E" ${item.key === 'E' ? 'selected' : ''}>E</option>
          <option value="F" ${item.key === 'F' ? 'selected' : ''}>F</option>
          <option value="F#" ${item.key === 'F#' ? 'selected' : ''}>F#</option>
          <option value="G" ${item.key === 'G' ? 'selected' : ''}>G</option>
          <option value="G#" ${item.key === 'G#' ? 'selected' : ''}>G#</option>
          <option value="A" ${item.key === 'A' ? 'selected' : ''}>A</option>
          <option value="A#" ${item.key === 'A#' ? 'selected' : ''}>A#</option>
          <option value="B" ${item.key === 'B' ? 'selected' : ''}>B</option>
        </select>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">
        <select class="form-input" style="font-size: 12px; padding: 6px 4px;" onchange="bulkUploadFiles[${index}].genre = this.value">
          <option value="">...</option>
          <option value="Hip Hop" ${item.genre === 'Hip Hop' ? 'selected' : ''}>Hip Hop</option>
          <option value="Trap" ${item.genre === 'Trap' ? 'selected' : ''}>Trap</option>
          <option value="R&B" ${item.genre === 'R&B' ? 'selected' : ''}>R&B</option>
          <option value="Pop" ${item.genre === 'Pop' ? 'selected' : ''}>Pop</option>
          <option value="Drill" ${item.genre === 'Drill' ? 'selected' : ''}>Drill</option>
        </select>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">
        <input type="number" class="form-input" value="${item.priceBasic}" style="font-size: 12px; padding: 6px 8px; width: 60px;" onchange="bulkUploadFiles[${index}].priceBasic = parseInt(this.value)">
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #E5E7EB; text-align: center;">
        ${item.status === 'pending' ? '<i data-lucide="clock" style="width:16px;height:16px;color:#6B7280;"></i>' :
          item.status === 'uploading' ? '<i data-lucide="loader" style="width:16px;height:16px;color:#F59E0B;"></i>' :
          item.status === 'done' ? '<i data-lucide="check" style="width:16px;height:16px;color:#10B981;"></i>' :
          '<i data-lucide="x" style="width:16px;height:16px;color:#DC2626;"></i>'}
      </td>
    </tr>
  `).join('');
}

async function detectBulkBpmKey(item, index) {
  // Simple BPM detection using Web Audio API
  try {
    const arrayBuffer = await item.file.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Basic tempo estimation
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Simplified beat detection
    let peaks = [];
    const threshold = 0.8;
    for (let i = 0; i < channelData.length; i += sampleRate / 10) {
      const slice = channelData.slice(i, i + sampleRate / 10);
      const max = Math.max(...slice.map(Math.abs));
      if (max > threshold) peaks.push(i);
    }

    if (peaks.length > 2) {
      const avgInterval = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
      const bpm = Math.round(60 / (avgInterval / sampleRate));
      if (bpm > 60 && bpm < 200) {
        bulkUploadFiles[index].bpm = bpm;
        renderBulkFilesGrid();
      }
    }
    audioContext.close();
  } catch (e) {
    // BPM detection failed silently
  }
}

function applyBulkSettings() {
  const genre = document.getElementById('bulkGenre').value;
  const priceBasic = parseInt(document.getElementById('bulkPriceBasic').value) || 30;
  const pricePremium = parseInt(document.getElementById('bulkPricePremium').value) || null;
  const priceExclusive = parseInt(document.getElementById('bulkPriceExclusive').value) || null;

  bulkUploadFiles.forEach(item => {
    if (genre) item.genre = genre;
    item.priceBasic = priceBasic;
    item.pricePremium = pricePremium;
    item.priceExclusive = priceExclusive;
  });

  renderBulkFilesGrid();
}

async function startBulkUpload() {
  const uploadBtn = document.getElementById('bulkUploadBtn');
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';

  document.getElementById('bulkProgressContainer').style.display = 'block';

  const user = await checkAuth();
  if (!user) return;

  const { data: producer } = await supabaseClient
    .from('producers')
    .select('id')
    .eq('email', user.email)
    .single();

  if (!producer) return;

  const total = bulkUploadFiles.length;
  let completed = 0;

  for (let i = 0; i < bulkUploadFiles.length; i++) {
    const item = bulkUploadFiles[i];
    item.status = 'uploading';
    renderBulkFilesGrid();

    try {
      // Upload audio file
      const audioFileName = `${producer.id}/${Date.now()}_${item.file.name}`;
      const { error: audioError } = await supabaseClient.storage
        .from('beats')
        .upload(audioFileName, item.file);

      if (audioError) throw audioError;

      const { data: { publicUrl: audioUrl } } = supabaseClient.storage
        .from('beats')
        .getPublicUrl(audioFileName);

      // Create beat record
      const { error: insertError } = await supabaseClient
        .from('beats')
        .insert([{
          producer_id: producer.id,
          title: item.title,
          audio_url: audioUrl,
          genre: item.genre || null,
          bpm: item.bpm,
          key: item.key,
          price_basic: item.priceBasic,
          price_premium: item.pricePremium,
          price_exclusive: item.priceExclusive,
          is_published: true
        }]);

      if (insertError) throw insertError;

      item.status = 'done';
    } catch (error) {
      console.error('Error uploading', item.title, error);
      item.status = 'error';
    }

    completed++;
    const progress = Math.round((completed / total) * 100);
    document.getElementById('bulkProgressBar').style.width = progress + '%';
    document.getElementById('bulkProgressText').textContent = progress + '%';
    renderBulkFilesGrid();
  }

  uploadBtn.textContent = 'Complete!';
  setTimeout(() => {
    closeBulkUploadModal();
    if (typeof loadBeats === 'function') loadBeats();
  }, 1500);
}

async function uploadBeat() {
  const uploadBtn = document.getElementById('uploadNextBtn');
  const uploadError = document.getElementById('uploadError');
  const progressDiv = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('uploadProgressBar');
  const statusText = document.getElementById('uploadStatus');

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  progressDiv.style.display = 'block';
  uploadError.innerHTML = '';

  try {
    const user = await checkAuth();
    if (!user) throw new Error('Not logged in');

    statusText.textContent = 'Getting producer info...';
    progressBar.style.width = '10%';

    const { data: producer, error: producerError } = await supabaseClient
      .from('producers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (producerError || !producer) {
      throw new Error('Producer account not found.');
    }

    // Use uploadState instead of form elements
    const title = uploadState.title;
    const bpm = uploadState.bpm;
    const key = uploadState.key;
    const genre = uploadState.genre;
    const audioFile = uploadState.audioFile;
    const coverFile = uploadState.coverFile;

    if (!audioFile || !coverFile) {
      throw new Error('Please select both audio file and cover art');
    }

    const priceBasic = uploadState.priceBasic * 100;
    const pricePremium = uploadState.pricePremium ? uploadState.pricePremium * 100 : null;
    const priceExclusive = uploadState.priceExclusive ? uploadState.priceExclusive * 100 : null;

    let beatData = {
      title,
      bpm: bpm || null,
      key: key || null,
      genre: genre || null,
      price_basic: priceBasic,
      price_premium: pricePremium,
      price_exclusive: priceExclusive,
      preview_start: uploadState.previewType !== 'full' ? uploadState.previewStart : null,
      preview_end: uploadState.previewType !== 'full' ? uploadState.previewEnd : null,
    };

    // Upload audio file
    statusText.textContent = 'Uploading audio file...';
    progressBar.style.width = '30%';

    const audioPath = `${producer.id}/${Date.now()}-${audioFile.name}`;
    const { error: audioError } = await supabaseClient.storage
      .from('beat-files')
      .upload(audioPath, audioFile);

    if (audioError) throw audioError;

    const { data: audioUrl } = supabaseClient.storage
      .from('beat-files')
      .getPublicUrl(audioPath);

    beatData.audio_url = audioUrl.publicUrl;
    beatData.audio_preview_url = audioUrl.publicUrl;

    // Upload cover art
    statusText.textContent = 'Uploading cover art...';
    progressBar.style.width = '60%';

    const coverPath = `${producer.id}/${Date.now()}-${coverFile.name}`;
    const { error: coverError } = await supabaseClient.storage
      .from('cover-art')
      .upload(coverPath, coverFile);

    if (coverError) throw coverError;

    const { data: coverUrl } = supabaseClient.storage
      .from('cover-art')
      .getPublicUrl(coverPath);

    beatData.cover_art_url = coverUrl.publicUrl;
    
    // Save to database
    statusText.textContent = 'Saving beat...';
    progressBar.style.width = '80%';

    beatData.producer_id = producer.id;
    beatData.is_published = true;

    const { error: beatError } = await supabaseClient
      .from('beats')
      .insert([beatData]);

    if (beatError) throw beatError;

    progressBar.style.width = '100%';
    statusText.textContent = 'Complete!';

    // Show success modal
    setTimeout(() => {
      closeUploadModal();
      showUploadSuccess(title);

      // Reload beats if on beats page
      if (typeof loadBeats === 'function') {
        setTimeout(() => loadBeats(), 500);
      }

      // Reload dashboard if on dashboard page
      if (typeof loadDashboard === 'function') {
        setTimeout(() => loadDashboard(), 500);
      }
    }, 500);

  } catch (error) {
    console.error('Upload failed:', error);
    uploadError.innerHTML = `<div class="alert alert-error">Error: ${error.message}</div>`;
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload Beat';
    progressDiv.style.display = 'none';
  }
}

function showUploadSuccess(beatTitle) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-body">
        <div class="modal-icon success"><i data-lucide="check" style="width:32px;height:32px;"></i></div>
        <h3 style="text-align: center; font-size: 24px; font-weight: 700; margin-bottom: 12px;">Beat Uploaded!</h3>
        <p class="modal-text">
          <strong>${beatTitle}</strong> has been uploaded successfully and is now live on your store.
        </p>
        <div style="margin-top: 24px; text-align: center;">
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Done</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

// Custom Dropdown Functions
function toggleDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  const isOpen = dropdown.classList.contains('open');

  // Close all other dropdowns
  document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));

  if (!isOpen) {
    dropdown.classList.add('open');
    lucide.createIcons();
  }
}

function selectDropdownOption(dropdownId, value, text, inputId) {
  const dropdown = document.getElementById(dropdownId);
  const textEl = document.getElementById(dropdownId + 'Text');
  const input = document.getElementById(inputId);

  // Update display
  textEl.textContent = text;
  input.value = value;

  // Update selected state
  dropdown.querySelectorAll('.custom-dropdown-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.value === value);
  });

  // Close dropdown
  dropdown.classList.remove('open');
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-dropdown')) {
    document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// Pricing Tier Toggle - ensures at least one tier is selected
function togglePricingTier(tier) {
  const tierEl = document.getElementById('tier' + tier);
  const checkbox = document.getElementById('tier' + tier + 'Enabled');

  // Check how many tiers are currently enabled
  const basicEnabled = document.getElementById('tierBasicEnabled')?.checked;
  const premiumEnabled = document.getElementById('tierPremiumEnabled')?.checked;
  const exclusiveEnabled = document.getElementById('tierExclusiveEnabled')?.checked;
  const enabledCount = [basicEnabled, premiumEnabled, exclusiveEnabled].filter(Boolean).length;

  // If trying to disable the last enabled tier, prevent it
  if (checkbox.checked && enabledCount <= 1) {
    // Show toast or visual feedback
    tierEl.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(() => tierEl.style.animation = '', 300);
    return;
  }

  checkbox.checked = !checkbox.checked;
  tierEl.classList.toggle('enabled', checkbox.checked);
}

// STRIPE-008: Refund management
function showRefundModal(saleId, beatTitle, amount, customerEmail) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'refundModal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Process Refund</h3>
        <button class="modal-close" onclick="closeRefundModal()">×</button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 16px;">You are about to refund this purchase:</p>
        <div style="background: var(--gray-light); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 8px;">${beatTitle}</div>
          <div style="font-size: 14px; color: var(--gray-dark);">Customer: ${customerEmail}</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--red); margin-top: 8px;">$${(amount / 100).toFixed(2)}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Reason for refund (optional)</label>
          <select class="form-input" id="refundReason">
            <option value="">Select a reason...</option>
            <option value="customer_request">Customer request</option>
            <option value="duplicate">Duplicate purchase</option>
            <option value="fraudulent">Fraudulent transaction</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 12px; margin-top: 16px;">
          <p style="color: #92400E; font-size: 13px; margin: 0;">
            <strong>Warning:</strong> This action cannot be undone. The customer will receive a full refund to their original payment method.
          </p>
        </div>
        <div id="refundError" style="margin-top: 16px;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeRefundModal()">Cancel</button>
        <button class="btn btn-danger" id="refundBtn" onclick="processRefund('${saleId}')">
          <i data-lucide="rotate-ccw" style="width:14px;height:14px;margin-right:6px;"></i> Process Refund
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

function closeRefundModal() {
  document.getElementById('refundModal')?.remove();
}

async function processRefund(saleId) {
  const refundBtn = document.getElementById('refundBtn');
  const errorDiv = document.getElementById('refundError');
  const reason = document.getElementById('refundReason')?.value || '';

  refundBtn.disabled = true;
  refundBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin-right:6px;"></span> Processing...';
  errorDiv.innerHTML = '';

  try {
    const response = await fetch('/.netlify/functions/process-refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saleId, reason })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Refund failed');
    }

    closeRefundModal();

    // Show success message
    const successModal = document.createElement('div');
    successModal.className = 'modal-overlay';
    successModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-body">
          <div class="modal-icon success"><i data-lucide="check" style="width:32px;height:32px;"></i></div>
          <h3 style="text-align: center; margin-bottom: 12px;">Refund Processed</h3>
          <p class="modal-text">The refund has been processed successfully. The customer will receive their refund within 5-10 business days.</p>
          <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); loadDashboard();">Done</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(successModal);
    lucide.createIcons();

  } catch (error) {
    console.error('Refund error:', error);
    errorDiv.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    refundBtn.disabled = false;
    refundBtn.innerHTML = '<i data-lucide="rotate-ccw" style="width:14px;height:14px;margin-right:6px;"></i> Process Refund';
    lucide.createIcons();
  }
}

// BPM Validation
function validateBpm(value) {
  const num = parseInt(value);
  if (isNaN(num)) return { valid: false, error: 'Please enter a number' };
  if (num < 60) return { valid: false, error: 'BPM must be at least 60' };
  if (num > 200) return { valid: false, error: 'BPM must be 200 or less' };
  return { valid: true };
}

// Initialize dropdown option click handlers after modal opens
function initDropdownHandlers() {
  // Genre dropdown options
  document.querySelectorAll('#genreDropdownOptions .custom-dropdown-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectDropdownOption('genreDropdown', opt.dataset.value, opt.textContent, 'beatGenre');
    });
  });

  // Key dropdown options
  document.querySelectorAll('#keyDropdownOptions .custom-dropdown-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectDropdownOption('keyDropdown', opt.dataset.value, opt.textContent, 'beatKey');
    });
  });

  // BPM validation on blur
  const bpmInput = document.getElementById('beatBpm');
  const bpmError = document.getElementById('bpmError');
  if (bpmInput && bpmError) {
    bpmInput.addEventListener('blur', () => {
      if (bpmInput.value) {
        const result = validateBpm(bpmInput.value);
        if (!result.valid) {
          bpmError.textContent = result.error;
          bpmError.style.display = 'block';
        } else {
          bpmError.style.display = 'none';
        }
      }
    });

    // Only allow numbers
    bpmInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }
}
