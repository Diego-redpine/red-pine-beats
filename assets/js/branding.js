// BP-001: White-label branding
// BP-002: Light/Dark mode toggle

// Apply branding from producer settings
async function applyBranding() {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: producer } = await supabaseClient
      .from('producers')
      .select('logo_url, primary_color')
      .eq('email', user.email)
      .single();

    if (producer) {
      // Apply custom logo if set
      if (producer.logo_url) {
        const logoImg = document.querySelector('.sidebar-logo img');
        if (logoImg) {
          logoImg.src = producer.logo_url;
          logoImg.alt = 'Producer Logo';
        }
      }

      // Apply custom primary color if set
      if (producer.primary_color) {
        document.documentElement.style.setProperty('--red', producer.primary_color);
        // Also update the hover color (darker version)
        const hoverColor = darkenColor(producer.primary_color, 20);
        document.documentElement.style.setProperty('--red-hover', hoverColor);
      }
    }
  } catch (error) {
    console.error('Error applying branding:', error);
  }
}

// Helper to darken a hex color
function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// BP-002: Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Set toggle state
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.checked = savedTheme === 'dark';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

// BP-005: Mobile menu toggle
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (sidebar) {
    sidebar.classList.toggle('open');
  }
  if (overlay) {
    overlay.classList.toggle('open');
  }
}

// Close mobile menu when clicking a nav link
function initMobileMenuClose() {
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
    });
  });
}

// POLISH-006: Toast notifications
function showToast(message, type = 'success', duration = 3000) {
  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Add icon based on type
  const icons = {
    success: 'check-circle',
    error: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" style="width: 20px; height: 20px;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Initialize Lucide icon if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Remove toast after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// POLISH-009: Keyboard shortcuts
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal-overlay');
      modals.forEach(modal => modal.remove());
    }

    // Cmd/Ctrl + S to save (prevent default and trigger save if available)
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      // Trigger save function if it exists on the page
      if (typeof saveSettings === 'function') {
        saveSettings();
      } else if (typeof saveStore === 'function') {
        saveStore();
      }
      showToast('Saved!', 'success');
    }
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  applyBranding();
  initMobileMenuClose();
  initKeyboardShortcuts();
});
