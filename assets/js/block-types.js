/**
 * Red Pine Site Editor - Block Type Definitions
 *
 * This file defines all available block types for the site editor.
 * Each block type includes metadata, default properties, and rendering info.
 */

/**
 * Block categories for grouping in the sidebar
 * @type {Object}
 */
export const BLOCK_CATEGORIES = {
  CONTENT: 'content',
  MEDIA: 'media',
  LAYOUT: 'layout',
  INTERACTIVE: 'interactive',
  ADVANCED: 'advanced'
};

/**
 * Category display names and icons
 * @type {Object}
 */
export const CATEGORY_INFO = {
  [BLOCK_CATEGORIES.CONTENT]: {
    name: 'Content',
    icon: 'type',
    description: 'Text and heading blocks'
  },
  [BLOCK_CATEGORIES.MEDIA]: {
    name: 'Media',
    icon: 'image',
    description: 'Images, videos, and audio'
  },
  [BLOCK_CATEGORIES.LAYOUT]: {
    name: 'Layout',
    icon: 'layout',
    description: 'Spacers, dividers, and containers'
  },
  [BLOCK_CATEGORIES.INTERACTIVE]: {
    name: 'Interactive',
    icon: 'mouse-pointer-click',
    description: 'Buttons, links, and social icons'
  },
  [BLOCK_CATEGORIES.ADVANCED]: {
    name: 'Advanced',
    icon: 'code',
    description: 'Beat players and custom HTML'
  }
};

/**
 * Block type definitions
 * Each block type includes:
 * - id: Unique identifier
 * - name: Display name
 * - icon: Lucide icon name
 * - category: Block category
 * - description: Short description
 * - defaultProps: Default properties for new instances
 * - propTypes: Schema for property validation
 *
 * @type {Array}
 */
export const blockTypes = [
  // ===== CONTENT BLOCKS =====
  {
    id: 'heading',
    name: 'Heading',
    icon: 'heading',
    category: BLOCK_CATEGORIES.CONTENT,
    description: 'Large title text',
    defaultProps: {
      text: 'Your Heading Here',
      level: 'h1',
      align: 'left',
      fontSize: 32,
      fontWeight: 700,
      color: '#1f2937',
      lineHeight: 1.2
    },
    propTypes: {
      text: { type: 'text', label: 'Text', required: true },
      level: { type: 'select', label: 'Level', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
      align: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'] },
      fontSize: { type: 'number', label: 'Font Size', min: 12, max: 120, unit: 'px' },
      fontWeight: { type: 'select', label: 'Weight', options: [400, 500, 600, 700, 800, 900] },
      color: { type: 'color', label: 'Color' },
      lineHeight: { type: 'number', label: 'Line Height', min: 0.8, max: 3, step: 0.1 }
    }
  },

  {
    id: 'text',
    name: 'Text',
    icon: 'type',
    category: BLOCK_CATEGORIES.CONTENT,
    description: 'Paragraph text',
    defaultProps: {
      text: 'Add your text here. You can write paragraphs, descriptions, or any content you want.',
      align: 'left',
      fontSize: 16,
      fontWeight: 400,
      color: '#374151',
      lineHeight: 1.6
    },
    propTypes: {
      text: { type: 'textarea', label: 'Text', required: true },
      align: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right', 'justify'] },
      fontSize: { type: 'number', label: 'Font Size', min: 10, max: 48, unit: 'px' },
      fontWeight: { type: 'select', label: 'Weight', options: [400, 500, 600, 700] },
      color: { type: 'color', label: 'Color' },
      lineHeight: { type: 'number', label: 'Line Height', min: 1, max: 3, step: 0.1 }
    }
  },

  // ===== MEDIA BLOCKS =====
  {
    id: 'image',
    name: 'Image',
    icon: 'image',
    category: BLOCK_CATEGORIES.MEDIA,
    description: 'Display an image',
    defaultProps: {
      src: '',
      alt: 'Image description',
      width: 'auto',
      height: 'auto',
      maxWidth: 100,
      borderRadius: 0,
      align: 'center',
      objectFit: 'cover'
    },
    propTypes: {
      src: { type: 'image', label: 'Image', required: true },
      alt: { type: 'text', label: 'Alt Text' },
      width: { type: 'text', label: 'Width', placeholder: 'auto or px' },
      height: { type: 'text', label: 'Height', placeholder: 'auto or px' },
      maxWidth: { type: 'number', label: 'Max Width %', min: 10, max: 100 },
      borderRadius: { type: 'number', label: 'Border Radius', min: 0, max: 100, unit: 'px' },
      align: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'] },
      objectFit: { type: 'select', label: 'Fit', options: ['cover', 'contain', 'fill'] }
    }
  },

  {
    id: 'video',
    name: 'Video',
    icon: 'video',
    category: BLOCK_CATEGORIES.MEDIA,
    description: 'Embed a video',
    defaultProps: {
      url: '',
      platform: 'youtube',
      autoplay: false,
      muted: true,
      controls: true,
      loop: false,
      aspectRatio: '16:9'
    },
    propTypes: {
      url: { type: 'text', label: 'Video URL', required: true, placeholder: 'YouTube or Vimeo URL' },
      platform: { type: 'select', label: 'Platform', options: ['youtube', 'vimeo', 'custom'] },
      autoplay: { type: 'toggle', label: 'Autoplay' },
      muted: { type: 'toggle', label: 'Muted' },
      controls: { type: 'toggle', label: 'Show Controls' },
      loop: { type: 'toggle', label: 'Loop' },
      aspectRatio: { type: 'select', label: 'Aspect Ratio', options: ['16:9', '4:3', '1:1', '9:16'] }
    }
  },

  {
    id: 'audio',
    name: 'Audio',
    icon: 'music',
    category: BLOCK_CATEGORIES.MEDIA,
    description: 'Audio player',
    defaultProps: {
      src: '',
      title: 'Audio Track',
      showWaveform: true,
      autoplay: false,
      loop: false,
      color: '#dc2626'
    },
    propTypes: {
      src: { type: 'audio', label: 'Audio File', required: true },
      title: { type: 'text', label: 'Title' },
      showWaveform: { type: 'toggle', label: 'Show Waveform' },
      autoplay: { type: 'toggle', label: 'Autoplay' },
      loop: { type: 'toggle', label: 'Loop' },
      color: { type: 'color', label: 'Player Color' }
    }
  },

  // ===== LAYOUT BLOCKS =====
  {
    id: 'spacer',
    name: 'Spacer',
    icon: 'move-vertical',
    category: BLOCK_CATEGORIES.LAYOUT,
    description: 'Add vertical space',
    defaultProps: {
      height: 40
    },
    propTypes: {
      height: { type: 'number', label: 'Height', min: 8, max: 200, unit: 'px' }
    }
  },

  {
    id: 'divider',
    name: 'Divider',
    icon: 'minus',
    category: BLOCK_CATEGORIES.LAYOUT,
    description: 'Horizontal line',
    defaultProps: {
      width: 100,
      thickness: 1,
      color: '#e5e7eb',
      style: 'solid',
      margin: 24
    },
    propTypes: {
      width: { type: 'number', label: 'Width %', min: 10, max: 100 },
      thickness: { type: 'number', label: 'Thickness', min: 1, max: 10, unit: 'px' },
      color: { type: 'color', label: 'Color' },
      style: { type: 'select', label: 'Style', options: ['solid', 'dashed', 'dotted'] },
      margin: { type: 'number', label: 'Vertical Margin', min: 0, max: 100, unit: 'px' }
    }
  },

  {
    id: 'section',
    name: 'Section',
    icon: 'square',
    category: BLOCK_CATEGORIES.LAYOUT,
    description: 'Container with background',
    defaultProps: {
      backgroundColor: '#ffffff',
      padding: 40,
      borderRadius: 0,
      maxWidth: 1200
    },
    propTypes: {
      backgroundColor: { type: 'color', label: 'Background' },
      padding: { type: 'number', label: 'Padding', min: 0, max: 200, unit: 'px' },
      borderRadius: { type: 'number', label: 'Corner Radius', min: 0, max: 50, unit: 'px' },
      maxWidth: { type: 'number', label: 'Max Width', min: 320, max: 1920, unit: 'px' }
    }
  },

  // ===== INTERACTIVE BLOCKS =====
  {
    id: 'button',
    name: 'Button',
    icon: 'square',
    category: BLOCK_CATEGORIES.INTERACTIVE,
    description: 'Clickable button',
    defaultProps: {
      text: 'Click Me',
      url: '#',
      target: '_self',
      backgroundColor: '#dc2626',
      textColor: '#ffffff',
      borderRadius: 8,
      padding: 'medium',
      align: 'left',
      fontWeight: 600,
      fullWidth: false
    },
    propTypes: {
      text: { type: 'text', label: 'Button Text', required: true },
      url: { type: 'text', label: 'Link URL' },
      target: { type: 'select', label: 'Open In', options: [{ value: '_self', label: 'Same Tab' }, { value: '_blank', label: 'New Tab' }] },
      backgroundColor: { type: 'color', label: 'Background' },
      textColor: { type: 'color', label: 'Text Color' },
      borderRadius: { type: 'number', label: 'Corner Radius', min: 0, max: 50, unit: 'px' },
      padding: { type: 'select', label: 'Size', options: ['small', 'medium', 'large'] },
      align: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'] },
      fontWeight: { type: 'select', label: 'Weight', options: [400, 500, 600, 700] },
      fullWidth: { type: 'toggle', label: 'Full Width' }
    }
  },

  {
    id: 'link',
    name: 'Link',
    icon: 'link',
    category: BLOCK_CATEGORIES.INTERACTIVE,
    description: 'Text link',
    defaultProps: {
      text: 'Click here',
      url: '#',
      target: '_self',
      color: '#dc2626',
      fontSize: 16,
      underline: true,
      align: 'left'
    },
    propTypes: {
      text: { type: 'text', label: 'Link Text', required: true },
      url: { type: 'text', label: 'URL', required: true },
      target: { type: 'select', label: 'Open In', options: [{ value: '_self', label: 'Same Tab' }, { value: '_blank', label: 'New Tab' }] },
      color: { type: 'color', label: 'Color' },
      fontSize: { type: 'number', label: 'Font Size', min: 12, max: 32, unit: 'px' },
      underline: { type: 'toggle', label: 'Underline' },
      align: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'] }
    }
  },

  {
    id: 'social-icons',
    name: 'Social Icons',
    icon: 'share-2',
    category: BLOCK_CATEGORIES.INTERACTIVE,
    description: 'Social media links',
    defaultProps: {
      icons: [
        { platform: 'instagram', url: '' },
        { platform: 'twitter', url: '' },
        { platform: 'youtube', url: '' }
      ],
      size: 24,
      color: '#1f2937',
      hoverColor: '#dc2626',
      spacing: 16,
      align: 'center',
      style: 'default'
    },
    propTypes: {
      icons: { type: 'social-list', label: 'Social Links' },
      size: { type: 'number', label: 'Icon Size', min: 16, max: 48, unit: 'px' },
      color: { type: 'color', label: 'Color' },
      hoverColor: { type: 'color', label: 'Hover Color' },
      spacing: { type: 'number', label: 'Spacing', min: 8, max: 48, unit: 'px' },
      align: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'] },
      style: { type: 'select', label: 'Style', options: ['default', 'rounded', 'circle'] }
    }
  },

  // ===== ADVANCED BLOCKS =====
  {
    id: 'beat-player',
    name: 'Beat Player',
    icon: 'music-2',
    category: BLOCK_CATEGORIES.ADVANCED,
    description: 'Showcase your beats',
    defaultProps: {
      title: 'My Beats',
      showTitle: true,
      showArtwork: true,
      showWaveform: true,
      showBpm: true,
      showKey: true,
      showPrice: true,
      layout: 'list',
      maxBeats: 5,
      theme: 'light',
      primaryColor: '#dc2626'
    },
    propTypes: {
      title: { type: 'text', label: 'Section Title' },
      showTitle: { type: 'toggle', label: 'Show Title' },
      showArtwork: { type: 'toggle', label: 'Show Artwork' },
      showWaveform: { type: 'toggle', label: 'Show Waveform' },
      showBpm: { type: 'toggle', label: 'Show BPM' },
      showKey: { type: 'toggle', label: 'Show Key' },
      showPrice: { type: 'toggle', label: 'Show Price' },
      layout: { type: 'select', label: 'Layout', options: ['list', 'grid', 'carousel'] },
      maxBeats: { type: 'number', label: 'Max Beats', min: 1, max: 20 },
      theme: { type: 'select', label: 'Theme', options: ['light', 'dark'] },
      primaryColor: { type: 'color', label: 'Primary Color' }
    }
  },

  {
    id: 'pricing-table',
    name: 'Pricing Table',
    icon: 'credit-card',
    category: BLOCK_CATEGORIES.ADVANCED,
    description: 'License pricing tiers',
    defaultProps: {
      tiers: [
        { name: 'Basic', price: 29, features: ['MP3 File', 'Non-Exclusive License'] },
        { name: 'Premium', price: 99, features: ['WAV + MP3', 'Premium License', 'Unlimited Streams'] },
        { name: 'Exclusive', price: 299, features: ['All Files + Stems', 'Full Ownership'] }
      ],
      highlighted: 1,
      columns: 3,
      currency: '$',
      ctaText: 'Select',
      showPopular: true
    },
    propTypes: {
      tiers: { type: 'pricing-tiers', label: 'Pricing Tiers' },
      highlighted: { type: 'number', label: 'Highlighted Tier', min: 0, max: 2 },
      columns: { type: 'select', label: 'Columns', options: [1, 2, 3] },
      currency: { type: 'select', label: 'Currency', options: ['$', '\u20ac', '\u00a3'] },
      ctaText: { type: 'text', label: 'Button Text' },
      showPopular: { type: 'toggle', label: 'Show Popular Badge' }
    }
  },

  {
    id: 'testimonial',
    name: 'Testimonial',
    icon: 'quote',
    category: BLOCK_CATEGORIES.ADVANCED,
    description: 'Customer quote',
    defaultProps: {
      quote: 'This is an amazing product! Highly recommended.',
      author: 'John Doe',
      title: 'Artist',
      avatar: '',
      rating: 5,
      showRating: true,
      style: 'card'
    },
    propTypes: {
      quote: { type: 'textarea', label: 'Quote', required: true },
      author: { type: 'text', label: 'Author Name' },
      title: { type: 'text', label: 'Author Title' },
      avatar: { type: 'image', label: 'Avatar' },
      rating: { type: 'number', label: 'Rating', min: 1, max: 5 },
      showRating: { type: 'toggle', label: 'Show Stars' },
      style: { type: 'select', label: 'Style', options: ['card', 'minimal', 'centered'] }
    }
  },

  {
    id: 'html',
    name: 'Custom HTML',
    icon: 'code',
    category: BLOCK_CATEGORIES.ADVANCED,
    description: 'Raw HTML code',
    defaultProps: {
      html: '<div style="padding: 20px; background: #f3f4f6; border-radius: 8px;">Custom HTML content</div>'
    },
    propTypes: {
      html: { type: 'code', label: 'HTML Code', language: 'html' }
    }
  }
];

/**
 * Get block type by ID
 * @param {string} id - Block type ID
 * @returns {Object|undefined} Block type definition
 */
export function getBlockTypeById(id) {
  return blockTypes.find(bt => bt.id === id);
}

/**
 * Get block types by category
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered block types
 */
export function getBlockTypesByCategory(category) {
  return blockTypes.filter(bt => bt.category === category);
}

/**
 * Get all block categories with their blocks
 * @returns {Object} Categories with block arrays
 */
export function getBlocksByCategory() {
  const result = {};
  Object.values(BLOCK_CATEGORIES).forEach(category => {
    result[category] = getBlockTypesByCategory(category);
  });
  return result;
}

/**
 * Create a new block instance with default props
 * @param {string} typeId - Block type ID
 * @returns {Object|null} New block instance or null if type not found
 */
export function createBlockInstance(typeId) {
  const blockType = getBlockTypeById(typeId);
  if (!blockType) return null;

  return {
    id: 'block_' + Math.random().toString(36).substring(2, 11),
    type: typeId,
    props: { ...blockType.defaultProps }
  };
}

// Export for global use
window.blockTypes = blockTypes;
window.BLOCK_CATEGORIES = BLOCK_CATEGORIES;
window.CATEGORY_INFO = CATEGORY_INFO;
window.getBlockTypeById = getBlockTypeById;
window.getBlockTypesByCategory = getBlockTypesByCategory;
window.getBlocksByCategory = getBlocksByCategory;
window.createBlockInstance = createBlockInstance;
