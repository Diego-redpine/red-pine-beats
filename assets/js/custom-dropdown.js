/**
 * Red Pine Custom Dropdown Component
 * A reusable dropdown that replaces native <select> elements
 * Features: Custom styling, animations, keyboard navigation, search/filter
 */

class CustomDropdown {
  constructor(element, options = {}) {
    this.originalSelect = element;
    this.options = {
      searchable: options.searchable || false,
      placeholder: options.placeholder || 'Select...',
      onChange: options.onChange || null,
      primaryColor: options.primaryColor || '#dc2626',
      ...options
    };

    this.isOpen = false;
    this.selectedIndex = -1;
    this.filteredOptions = [];

    this.init();
  }

  init() {
    // Hide original select
    this.originalSelect.style.display = 'none';

    // Create custom dropdown wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'custom-dropdown';
    this.wrapper.setAttribute('tabindex', '0');

    // Create trigger button
    this.trigger = document.createElement('div');
    this.trigger.className = 'custom-dropdown-trigger';
    this.trigger.innerHTML = `
      <span class="custom-dropdown-value">${this.options.placeholder}</span>
      <svg class="custom-dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    // Create dropdown panel
    this.panel = document.createElement('div');
    this.panel.className = 'custom-dropdown-panel';

    // Add search input if searchable
    if (this.options.searchable) {
      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.className = 'custom-dropdown-search';
      this.searchInput.placeholder = 'Search...';
      this.searchInput.addEventListener('input', (e) => this.filterOptions(e.target.value));
      this.searchInput.addEventListener('click', (e) => e.stopPropagation());
      this.panel.appendChild(this.searchInput);
    }

    // Create options list
    this.optionsList = document.createElement('div');
    this.optionsList.className = 'custom-dropdown-options';
    this.panel.appendChild(this.optionsList);

    // Build wrapper
    this.wrapper.appendChild(this.trigger);
    this.wrapper.appendChild(this.panel);

    // Insert after original select
    this.originalSelect.parentNode.insertBefore(this.wrapper, this.originalSelect.nextSibling);

    // Populate options
    this.populateOptions();

    // Set initial value
    if (this.originalSelect.value) {
      this.setValue(this.originalSelect.value, false);
    }

    // Event listeners
    this.trigger.addEventListener('click', () => this.toggle());
    this.wrapper.addEventListener('keydown', (e) => this.handleKeydown(e));
    document.addEventListener('click', (e) => this.handleOutsideClick(e));

    // Sync with original select changes
    this.originalSelect.addEventListener('change', () => {
      this.setValue(this.originalSelect.value, false);
    });
  }

  populateOptions() {
    this.optionsList.innerHTML = '';
    const options = Array.from(this.originalSelect.options);
    this.filteredOptions = options;

    options.forEach((option, index) => {
      if (option.value === '' && option.text === '') return; // Skip empty placeholder

      const optionEl = document.createElement('div');
      optionEl.className = 'custom-dropdown-option';
      optionEl.dataset.value = option.value;
      optionEl.dataset.index = index;
      optionEl.textContent = option.text;

      if (option.selected) {
        optionEl.classList.add('selected');
        this.selectedIndex = index;
        this.trigger.querySelector('.custom-dropdown-value').textContent = option.text;
      }

      optionEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectOption(option.value, option.text);
      });

      this.optionsList.appendChild(optionEl);
    });
  }

  filterOptions(query) {
    const options = this.optionsList.querySelectorAll('.custom-dropdown-option');
    const lowerQuery = query.toLowerCase();

    options.forEach(option => {
      const text = option.textContent.toLowerCase();
      option.style.display = text.includes(lowerQuery) ? '' : 'none';
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.wrapper.classList.add('open');
    this.trigger.classList.add('open');
    this.panel.classList.add('open');

    if (this.searchInput) {
      this.searchInput.value = '';
      this.filterOptions('');
      setTimeout(() => this.searchInput.focus(), 50);
    }

    // Highlight selected option
    this.highlightOption(this.selectedIndex);
  }

  close() {
    this.isOpen = false;
    this.wrapper.classList.remove('open');
    this.trigger.classList.remove('open');
    this.panel.classList.remove('open');
  }

  selectOption(value, text) {
    // Update original select
    this.originalSelect.value = value;

    // Update display
    this.trigger.querySelector('.custom-dropdown-value').textContent = text;

    // Update selected state
    this.optionsList.querySelectorAll('.custom-dropdown-option').forEach((opt, idx) => {
      opt.classList.toggle('selected', opt.dataset.value === value);
      if (opt.dataset.value === value) {
        this.selectedIndex = idx;
      }
    });

    // Close dropdown
    this.close();

    // Trigger change event
    this.originalSelect.dispatchEvent(new Event('change', { bubbles: true }));

    // Callback
    if (this.options.onChange) {
      this.options.onChange(value, text);
    }
  }

  setValue(value, triggerChange = true) {
    const option = Array.from(this.originalSelect.options).find(opt => opt.value === value);
    if (option) {
      if (triggerChange) {
        this.selectOption(value, option.text);
      } else {
        this.trigger.querySelector('.custom-dropdown-value').textContent = option.text;
        this.optionsList.querySelectorAll('.custom-dropdown-option').forEach((opt, idx) => {
          opt.classList.toggle('selected', opt.dataset.value === value);
          if (opt.dataset.value === value) {
            this.selectedIndex = idx;
          }
        });
      }
    }
  }

  highlightOption(index) {
    const options = this.optionsList.querySelectorAll('.custom-dropdown-option:not([style*="display: none"])');
    options.forEach((opt, idx) => {
      opt.classList.toggle('highlighted', idx === index);
    });
  }

  handleKeydown(e) {
    const visibleOptions = Array.from(this.optionsList.querySelectorAll('.custom-dropdown-option:not([style*="display: none"])'));

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.isOpen) {
          const highlighted = visibleOptions.find(opt => opt.classList.contains('highlighted'));
          if (highlighted) {
            this.selectOption(highlighted.dataset.value, highlighted.textContent);
          }
        } else {
          this.open();
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!this.isOpen) {
          this.open();
        } else {
          const currentHighlight = visibleOptions.findIndex(opt => opt.classList.contains('highlighted'));
          const nextIndex = currentHighlight < visibleOptions.length - 1 ? currentHighlight + 1 : 0;
          visibleOptions.forEach((opt, idx) => opt.classList.toggle('highlighted', idx === nextIndex));
          visibleOptions[nextIndex]?.scrollIntoView({ block: 'nearest' });
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this.isOpen) {
          const currentHighlight = visibleOptions.findIndex(opt => opt.classList.contains('highlighted'));
          const prevIndex = currentHighlight > 0 ? currentHighlight - 1 : visibleOptions.length - 1;
          visibleOptions.forEach((opt, idx) => opt.classList.toggle('highlighted', idx === prevIndex));
          visibleOptions[prevIndex]?.scrollIntoView({ block: 'nearest' });
        }
        break;
    }
  }

  handleOutsideClick(e) {
    if (this.isOpen && !this.wrapper.contains(e.target)) {
      this.close();
    }
  }

  destroy() {
    this.wrapper.remove();
    this.originalSelect.style.display = '';
    document.removeEventListener('click', this.handleOutsideClick);
  }
}

// CSS styles for custom dropdown
const customDropdownStyles = `
.custom-dropdown {
  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.custom-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #374151;
}

.custom-dropdown-trigger:hover {
  border-color: #d1d5db;
}

.custom-dropdown-trigger.open {
  border-color: var(--red, #dc2626);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.custom-dropdown-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-dropdown-arrow {
  flex-shrink: 0;
  margin-left: 8px;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.custom-dropdown-trigger.open .custom-dropdown-arrow {
  transform: rotate(180deg);
}

.custom-dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
}

.custom-dropdown-panel.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.custom-dropdown-search {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
  font-size: 14px;
  outline: none;
}

.custom-dropdown-search:focus {
  background: #f9fafb;
}

.custom-dropdown-options {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.custom-dropdown-option {
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
  font-size: 14px;
  color: #374151;
}

.custom-dropdown-option:hover,
.custom-dropdown-option.highlighted {
  background: #f3f4f6;
}

.custom-dropdown-option.selected {
  background: rgba(220, 38, 38, 0.1);
  color: var(--red, #dc2626);
  font-weight: 500;
}

.custom-dropdown-option.selected:hover,
.custom-dropdown-option.selected.highlighted {
  background: rgba(220, 38, 38, 0.15);
}
`;

// Inject styles
function injectDropdownStyles() {
  if (!document.getElementById('custom-dropdown-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'custom-dropdown-styles';
    styleEl.textContent = customDropdownStyles;
    document.head.appendChild(styleEl);
  }
}

// Initialize all dropdowns with data-custom-dropdown attribute
function initCustomDropdowns() {
  injectDropdownStyles();
  document.querySelectorAll('select[data-custom-dropdown]').forEach(select => {
    new CustomDropdown(select, {
      searchable: select.dataset.searchable === 'true',
      placeholder: select.dataset.placeholder || 'Select...'
    });
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomDropdowns);
} else {
  initCustomDropdowns();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CustomDropdown, initCustomDropdowns, injectDropdownStyles };
}
