/**
 * Red Pine Site Editor - Template Definitions
 *
 * This file contains all starter templates for the site editor.
 * Each template has a unique structure of blocks that users can customize.
 */

// Template categories
export const TEMPLATE_CATEGORIES = {
  ALL: 'all',
  STARTER: 'starter',
  BUSINESS: 'business',
  CREATIVE: 'creative',
  MUSIC: 'music'
};

/**
 * Generate a unique block ID
 * @returns {string} Unique ID
 */
function generateId() {
  return 'block_' + Math.random().toString(36).substring(2, 11);
}

/**
 * Starter Templates
 * Each template includes:
 * - id: Unique identifier
 * - name: Display name
 * - description: Short description
 * - thumbnail: Preview image path
 * - category: Template category
 * - blocks: Array of block configurations
 */
export const templates = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design with lots of whitespace',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f9fafb" width="300" height="200"/%3E%3Crect fill="%23e5e7eb" x="100" y="40" width="100" height="20"/%3E%3Crect fill="%23d1d5db" x="80" y="80" width="140" height="8"/%3E%3Crect fill="%23d1d5db" x="60" y="100" width="180" height="8"/%3E%3Crect fill="%23dc2626" x="115" y="140" width="70" height="24" rx="4"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.STARTER,
    blocks: [
      {
        id: generateId(),
        type: 'heading',
        props: {
          text: 'Welcome to My Site',
          level: 'h1',
          align: 'center',
          fontSize: 48,
          fontWeight: 700,
          color: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'text',
        props: {
          text: 'I create beats that move people. Explore my catalog and find the perfect sound for your next project.',
          align: 'center',
          fontSize: 18,
          color: '#6b7280',
          lineHeight: 1.6
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'button',
        props: {
          text: 'Browse Beats',
          url: '#beats',
          backgroundColor: '#dc2626',
          textColor: '#ffffff',
          borderRadius: 8,
          padding: 'large',
          align: 'center'
        }
      }
    ]
  },

  {
    id: 'professional',
    name: 'Professional',
    description: 'Business-ready design with features section',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%231e3a5f" width="300" height="80"/%3E%3Crect fill="%23ffffff" y="80" width="300" height="120"/%3E%3Crect fill="%23ffffff" x="100" y="30" width="100" height="20"/%3E%3Crect fill="%23e5e7eb" x="30" y="100" width="70" height="50"/%3E%3Crect fill="%23e5e7eb" x="115" y="100" width="70" height="50"/%3E%3Crect fill="%23e5e7eb" x="200" y="100" width="70" height="50"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.BUSINESS,
    blocks: [
      {
        id: generateId(),
        type: 'section',
        props: {
          backgroundColor: '#1e3a5f',
          padding: 60
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            props: {
              text: 'Professional Beat Producer',
              level: 'h1',
              align: 'center',
              fontSize: 42,
              fontWeight: 700,
              color: '#ffffff'
            }
          },
          {
            id: generateId(),
            type: 'text',
            props: {
              text: 'Premium quality beats for artists, labels, and content creators',
              align: 'center',
              fontSize: 18,
              color: '#94a3b8'
            }
          }
        ]
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 60 }
      },
      {
        id: generateId(),
        type: 'heading',
        props: {
          text: 'Why Choose My Beats?',
          level: 'h2',
          align: 'center',
          fontSize: 32,
          fontWeight: 600,
          color: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 30 }
      },
      {
        id: generateId(),
        type: 'text',
        props: {
          text: 'Industry-standard quality, fast delivery, and flexible licensing options.',
          align: 'center',
          fontSize: 16,
          color: '#6b7280'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'button',
        props: {
          text: 'Get Started',
          url: '#contact',
          backgroundColor: '#dc2626',
          textColor: '#ffffff',
          borderRadius: 8,
          padding: 'large',
          align: 'center'
        }
      }
    ]
  },

  {
    id: 'bold',
    name: 'Bold',
    description: 'High contrast design with vibrant colors',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23000000" width="300" height="200"/%3E%3Crect fill="%23dc2626" x="20" y="40" width="260" height="6"/%3E%3Crect fill="%23ffffff" x="60" y="70" width="180" height="30"/%3E%3Crect fill="%2322c55e" x="100" y="130" width="100" height="30"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.CREATIVE,
    blocks: [
      {
        id: generateId(),
        type: 'divider',
        props: {
          width: 100,
          thickness: 6,
          color: '#dc2626',
          style: 'solid'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'heading',
        props: {
          text: 'MAKE YOUR MARK',
          level: 'h1',
          align: 'center',
          fontSize: 56,
          fontWeight: 900,
          color: '#1f2937',
          textTransform: 'uppercase'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 20 }
      },
      {
        id: generateId(),
        type: 'text',
        props: {
          text: 'Bold beats for bold artists. Stand out from the crowd.',
          align: 'center',
          fontSize: 20,
          color: '#6b7280',
          fontWeight: 500
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'button',
        props: {
          text: 'EXPLORE NOW',
          url: '#beats',
          backgroundColor: '#22c55e',
          textColor: '#ffffff',
          borderRadius: 0,
          padding: 'large',
          align: 'center',
          fontWeight: 700
        }
      }
    ]
  },

  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Gallery-focused design to showcase your work',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f9fafb" width="300" height="200"/%3E%3Crect fill="%23e5e7eb" x="20" y="40" width="80" height="60"/%3E%3Crect fill="%23e5e7eb" x="110" y="40" width="80" height="60"/%3E%3Crect fill="%23e5e7eb" x="200" y="40" width="80" height="60"/%3E%3Crect fill="%23e5e7eb" x="20" y="110" width="80" height="60"/%3E%3Crect fill="%23e5e7eb" x="110" y="110" width="80" height="60"/%3E%3Crect fill="%23e5e7eb" x="200" y="110" width="80" height="60"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.CREATIVE,
    blocks: [
      {
        id: generateId(),
        type: 'heading',
        props: {
          text: 'My Work',
          level: 'h1',
          align: 'left',
          fontSize: 48,
          fontWeight: 700,
          color: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'text',
        props: {
          text: 'A collection of my best beats and productions',
          align: 'left',
          fontSize: 18,
          color: '#6b7280'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'divider',
        props: {
          width: 100,
          thickness: 1,
          color: '#e5e7eb',
          style: 'solid'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'beat-player',
        props: {
          title: 'Featured Beats',
          showArtwork: true,
          showWaveform: true,
          theme: 'light'
        }
      }
    ]
  },

  {
    id: 'music',
    name: 'Music',
    description: 'Audio-focused design for beat sellers',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23111827" width="300" height="200"/%3E%3Crect fill="%23374151" x="40" y="80" width="20" height="40" rx="2"/%3E%3Crect fill="%23374151" x="70" y="60" width="20" height="80" rx="2"/%3E%3Crect fill="%23dc2626" x="100" y="50" width="20" height="100" rx="2"/%3E%3Crect fill="%23374151" x="130" y="70" width="20" height="60" rx="2"/%3E%3Crect fill="%23374151" x="160" y="55" width="20" height="90" rx="2"/%3E%3Crect fill="%23374151" x="190" y="75" width="20" height="50" rx="2"/%3E%3Crect fill="%23374151" x="220" y="65" width="20" height="70" rx="2"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.MUSIC,
    blocks: [
      {
        id: generateId(),
        type: 'section',
        props: {
          backgroundColor: '#111827',
          padding: 60
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            props: {
              text: 'The Sound You Need',
              level: 'h1',
              align: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: '#ffffff'
            }
          },
          {
            id: generateId(),
            type: 'text',
            props: {
              text: 'Premium beats crafted for the modern artist',
              align: 'center',
              fontSize: 18,
              color: '#9ca3af'
            }
          }
        ]
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'beat-player',
        props: {
          title: 'Latest Beats',
          showArtwork: true,
          showWaveform: true,
          theme: 'dark'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'pricing-table',
        props: {
          columns: 3,
          highlighted: 1,
          tiers: [
            { name: 'Basic', price: 29, features: ['MP3 File', 'Non-Exclusive License', 'Up to 5k Streams'] },
            { name: 'Premium', price: 99, features: ['WAV + MP3 Files', 'Premium License', 'Unlimited Streams', 'YouTube Monetization'] },
            { name: 'Exclusive', price: 299, features: ['All Files + Stems', 'Full Ownership', 'Unlimited Everything', 'Priority Support'] }
          ]
        }
      }
    ]
  },

  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Conversion-optimized single page design',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23dc2626" width="300" height="70"/%3E%3Crect fill="%23ffffff" y="70" width="300" height="130"/%3E%3Crect fill="%23ffffff" x="100" y="25" width="100" height="20"/%3E%3Ccircle fill="%23e5e7eb" cx="70" cy="120" r="25"/%3E%3Ccircle fill="%23e5e7eb" cx="150" cy="120" r="25"/%3E%3Ccircle fill="%23e5e7eb" cx="230" cy="120" r="25"/%3E%3Crect fill="%23dc2626" x="115" y="165" width="70" height="20" rx="4"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.BUSINESS,
    blocks: [
      {
        id: generateId(),
        type: 'section',
        props: {
          backgroundColor: '#dc2626',
          padding: 80
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            props: {
              text: 'Get Your Next Hit',
              level: 'h1',
              align: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: '#ffffff'
            }
          },
          {
            id: generateId(),
            type: 'text',
            props: {
              text: 'Professional beats ready for your next project',
              align: 'center',
              fontSize: 20,
              color: 'rgba(255,255,255,0.9)'
            }
          },
          {
            id: generateId(),
            type: 'spacer',
            props: { height: 30 }
          },
          {
            id: generateId(),
            type: 'button',
            props: {
              text: 'Start Browsing',
              url: '#beats',
              backgroundColor: '#ffffff',
              textColor: '#dc2626',
              borderRadius: 8,
              padding: 'large',
              align: 'center'
            }
          }
        ]
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 60 }
      },
      {
        id: generateId(),
        type: 'heading',
        props: {
          text: 'Trusted by Artists Worldwide',
          level: 'h2',
          align: 'center',
          fontSize: 32,
          fontWeight: 600,
          color: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'testimonial',
        props: {
          quote: 'These beats helped me land my first major placement. Quality is unmatched!',
          author: 'DJ Mike',
          title: 'Hip Hop Artist',
          rating: 5
        }
      }
    ]
  },

  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Modern dark theme with neon accents',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23111827" width="300" height="200"/%3E%3Crect fill="%2300ff88" x="100" y="40" width="100" height="4"/%3E%3Crect fill="%23ffffff" x="80" y="70" width="140" height="20"/%3E%3Crect fill="%236b7280" x="60" y="110" width="180" height="8"/%3E%3Crect fill="%2300ff88" x="115" y="150" width="70" height="24" rx="4"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.CREATIVE,
    blocks: [
      {
        id: generateId(),
        type: 'section',
        props: {
          backgroundColor: '#111827',
          padding: 60
        },
        children: [
          {
            id: generateId(),
            type: 'divider',
            props: {
              width: 30,
              thickness: 4,
              color: '#00ff88',
              style: 'solid',
              align: 'center'
            }
          },
          {
            id: generateId(),
            type: 'spacer',
            props: { height: 30 }
          },
          {
            id: generateId(),
            type: 'heading',
            props: {
              text: 'Future Sounds',
              level: 'h1',
              align: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: '#ffffff'
            }
          },
          {
            id: generateId(),
            type: 'text',
            props: {
              text: 'Cutting-edge beats for the next generation of artists',
              align: 'center',
              fontSize: 18,
              color: '#9ca3af'
            }
          },
          {
            id: generateId(),
            type: 'spacer',
            props: { height: 40 }
          },
          {
            id: generateId(),
            type: 'button',
            props: {
              text: 'Explore Catalog',
              url: '#beats',
              backgroundColor: '#00ff88',
              textColor: '#111827',
              borderRadius: 8,
              padding: 'large',
              align: 'center',
              fontWeight: 600
            }
          }
        ]
      }
    ]
  },

  {
    id: 'one-page',
    name: 'One Page',
    description: 'Single scroll page with all sections',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f9fafb" width="300" height="200"/%3E%3Crect fill="%23dc2626" y="0" width="300" height="50"/%3E%3Crect fill="%23e5e7eb" y="55" width="300" height="45"/%3E%3Crect fill="%23f3f4f6" y="105" width="300" height="45"/%3E%3Crect fill="%23e5e7eb" y="155" width="300" height="45"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.STARTER,
    blocks: [
      {
        id: generateId(),
        type: 'section',
        props: {
          backgroundColor: '#dc2626',
          padding: 80,
          id: 'hero'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            props: {
              text: 'Your Name Here',
              level: 'h1',
              align: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: '#ffffff'
            }
          },
          {
            id: generateId(),
            type: 'text',
            props: {
              text: 'Beat Producer | Sound Designer | Artist',
              align: 'center',
              fontSize: 18,
              color: 'rgba(255,255,255,0.9)'
            }
          }
        ]
      },
      {
        id: generateId(),
        type: 'section',
        props: {
          backgroundColor: '#ffffff',
          padding: 60,
          id: 'about'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            props: {
              text: 'About Me',
              level: 'h2',
              align: 'center',
              fontSize: 32,
              fontWeight: 600,
              color: '#1f2937'
            }
          },
          {
            id: generateId(),
            type: 'text',
            props: {
              text: 'Write your story here. Tell visitors who you are, what you do, and why they should work with you.',
              align: 'center',
              fontSize: 16,
              color: '#6b7280'
            }
          }
        ]
      },
      {
        id: generateId(),
        type: 'section',
        props: {
          backgroundColor: '#f9fafb',
          padding: 60,
          id: 'beats'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            props: {
              text: 'My Beats',
              level: 'h2',
              align: 'center',
              fontSize: 32,
              fontWeight: 600,
              color: '#1f2937'
            }
          },
          {
            id: generateId(),
            type: 'beat-player',
            props: {
              showArtwork: true,
              showWaveform: true,
              theme: 'light'
            }
          }
        ]
      },
      {
        id: generateId(),
        type: 'section',
        props: {
          backgroundColor: '#1f2937',
          padding: 40,
          id: 'contact'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            props: {
              text: 'Get in Touch',
              level: 'h3',
              align: 'center',
              fontSize: 24,
              fontWeight: 600,
              color: '#ffffff'
            }
          },
          {
            id: generateId(),
            type: 'social-icons',
            props: {
              icons: ['instagram', 'twitter', 'youtube', 'soundcloud'],
              size: 24,
              color: '#ffffff',
              align: 'center'
            }
          }
        ]
      }
    ]
  },

  {
    id: 'bio-link',
    name: 'Bio Link',
    description: 'Linktree-style page for social bios',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f3f4f6" width="300" height="200"/%3E%3Ccircle fill="%23e5e7eb" cx="150" cy="50" r="30"/%3E%3Crect fill="%23dc2626" x="75" y="100" width="150" height="24" rx="12"/%3E%3Crect fill="%23374151" x="75" y="130" width="150" height="24" rx="12"/%3E%3Crect fill="%23374151" x="75" y="160" width="150" height="24" rx="12"/%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.STARTER,
    blocks: [
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'image',
        props: {
          src: '',
          alt: 'Profile Photo',
          width: 120,
          height: 120,
          borderRadius: 60,
          align: 'center'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 20 }
      },
      {
        id: generateId(),
        type: 'heading',
        props: {
          text: '@yourname',
          level: 'h1',
          align: 'center',
          fontSize: 28,
          fontWeight: 700,
          color: '#1f2937'
        }
      },
      {
        id: generateId(),
        type: 'text',
        props: {
          text: 'Beat Producer | Your short bio here',
          align: 'center',
          fontSize: 14,
          color: '#6b7280'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 30 }
      },
      {
        id: generateId(),
        type: 'button',
        props: {
          text: 'Browse My Beats',
          url: '#',
          backgroundColor: '#dc2626',
          textColor: '#ffffff',
          borderRadius: 50,
          padding: 'large',
          width: 'full',
          align: 'center'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 12 }
      },
      {
        id: generateId(),
        type: 'button',
        props: {
          text: 'Instagram',
          url: '#',
          backgroundColor: '#1f2937',
          textColor: '#ffffff',
          borderRadius: 50,
          padding: 'large',
          width: 'full',
          align: 'center'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 12 }
      },
      {
        id: generateId(),
        type: 'button',
        props: {
          text: 'YouTube',
          url: '#',
          backgroundColor: '#1f2937',
          textColor: '#ffffff',
          borderRadius: 50,
          padding: 'large',
          width: 'full',
          align: 'center'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 12 }
      },
      {
        id: generateId(),
        type: 'button',
        props: {
          text: 'SoundCloud',
          url: '#',
          backgroundColor: '#1f2937',
          textColor: '#ffffff',
          borderRadius: 50,
          padding: 'large',
          width: 'full',
          align: 'center'
        }
      },
      {
        id: generateId(),
        type: 'spacer',
        props: { height: 40 }
      },
      {
        id: generateId(),
        type: 'social-icons',
        props: {
          icons: ['instagram', 'twitter', 'youtube', 'soundcloud', 'spotify'],
          size: 20,
          color: '#6b7280',
          align: 'center'
        }
      }
    ]
  },

  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch with an empty canvas',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ffffff" width="300" height="200"/%3E%3Crect fill="none" stroke="%23e5e7eb" stroke-width="2" stroke-dasharray="8,4" x="20" y="20" width="260" height="160"/%3E%3Ctext x="150" y="105" text-anchor="middle" fill="%239ca3af" font-size="14" font-family="sans-serif">Start Fresh</text%3E%3C/svg%3E',
    category: TEMPLATE_CATEGORIES.STARTER,
    blocks: []
  }
];

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Object|undefined} Template object or undefined
 */
export function getTemplateById(id) {
  return templates.find(t => t.id === id);
}

/**
 * Get templates by category
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered templates
 */
export function getTemplatesByCategory(category) {
  if (category === TEMPLATE_CATEGORIES.ALL) {
    return templates;
  }
  return templates.filter(t => t.category === category);
}

/**
 * Deep clone a template's blocks (to avoid reference issues)
 * @param {Object} template - Template object
 * @returns {Array} Cloned blocks with new IDs
 */
export function cloneTemplateBlocks(template) {
  const cloneBlock = (block) => {
    const cloned = {
      ...block,
      id: generateId(),
      props: { ...block.props }
    };
    if (block.children) {
      cloned.children = block.children.map(cloneBlock);
    }
    return cloned;
  };

  return template.blocks.map(cloneBlock);
}
