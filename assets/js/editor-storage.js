/**
 * Red Pine Site Editor - Storage Module
 *
 * Handles saving and loading editor designs to/from Supabase.
 * Uses the site_customizations table with website_json column.
 */

/**
 * Save the editor design to Supabase
 * @param {string} userId - The user's producer ID
 * @param {Object} designData - The design data to save
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function saveDesign(userId, designData) {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  try {
    // Prepare the data
    const saveData = {
      website_json: JSON.stringify(designData),
      updated_at: new Date().toISOString()
    };

    // Check if record exists
    const { data: existing } = await supabaseClient
      .from('site_customizations')
      .select('id')
      .eq('producer_id', userId)
      .single();

    let result;

    if (existing) {
      // Update existing record
      result = await supabaseClient
        .from('site_customizations')
        .update(saveData)
        .eq('producer_id', userId);
    } else {
      // Insert new record
      result = await supabaseClient
        .from('site_customizations')
        .insert({
          producer_id: userId,
          ...saveData
        });
    }

    if (result.error) {
      console.error('Supabase save error:', result.error);
      return { success: false, error: 'Failed to save design. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Save design error:', error);
    return { success: false, error: 'An unexpected error occurred while saving.' };
  }
}

/**
 * Load the editor design from Supabase
 * @param {string} userId - The user's producer ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
async function loadDesign(userId) {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  try {
    const { data, error } = await supabaseClient
      .from('site_customizations')
      .select('website_json, website_published, theme_colors, theme_fonts, theme_layout, updated_at')
      .eq('producer_id', userId)
      .single();

    if (error) {
      // PGRST116 means no rows returned - not an error, just no saved design
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }
      console.error('Supabase load error:', error);
      return { success: false, error: 'Failed to load design. Please refresh the page.' };
    }

    // Parse the JSON data
    let designData = null;
    if (data && data.website_json) {
      try {
        designData = JSON.parse(data.website_json);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return { success: false, error: 'Design data is corrupted. Starting fresh.' };
      }
    }

    return {
      success: true,
      data: {
        design: designData,
        published: data?.website_published || false,
        themeColors: data?.theme_colors,
        themeFonts: data?.theme_fonts,
        themeLayout: data?.theme_layout,
        updatedAt: data?.updated_at
      }
    };
  } catch (error) {
    console.error('Load design error:', error);
    return { success: false, error: 'An unexpected error occurred while loading.' };
  }
}

/**
 * Publish or unpublish the site
 * @param {string} userId - The user's producer ID
 * @param {boolean} publish - Whether to publish or unpublish
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function publishSite(userId, publish = true) {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  try {
    const updateData = {
      website_published: publish,
      updated_at: new Date().toISOString()
    };

    if (publish) {
      updateData.last_published_at = new Date().toISOString();
    }

    const { error } = await supabaseClient
      .from('site_customizations')
      .update(updateData)
      .eq('producer_id', userId);

    if (error) {
      console.error('Supabase publish error:', error);
      return { success: false, error: `Failed to ${publish ? 'publish' : 'unpublish'} site.` };
    }

    return { success: true };
  } catch (error) {
    console.error('Publish error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Save theme settings
 * @param {string} userId - The user's producer ID
 * @param {Object} theme - Theme data { colors, fonts, layout }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function saveTheme(userId, theme) {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  try {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (theme.colors) updateData.theme_colors = JSON.stringify(theme.colors);
    if (theme.fonts) updateData.theme_fonts = JSON.stringify(theme.fonts);
    if (theme.layout) updateData.theme_layout = JSON.stringify(theme.layout);

    const { error } = await supabaseClient
      .from('site_customizations')
      .update(updateData)
      .eq('producer_id', userId);

    if (error) {
      console.error('Supabase theme save error:', error);
      return { success: false, error: 'Failed to save theme settings.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Theme save error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Get the current user's producer ID
 * @returns {Promise<{userId: string|null, user: Object|null}>}
 */
async function getCurrentUser() {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return { userId: null, user: null };
    }

    // Get producer ID from email
    const { data: producer } = await supabaseClient
      .from('producers')
      .select('id, name, email, subdomain')
      .eq('email', user.email)
      .single();

    return {
      userId: producer?.id || null,
      user: {
        ...user,
        producer
      }
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return { userId: null, user: null };
  }
}

/**
 * Create a version snapshot of the current design
 * @param {string} userId - The user's producer ID
 * @param {Object} designData - The design data to snapshot
 * @param {string} description - Optional description of the version
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function createVersion(userId, designData, description = '') {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  try {
    const { error } = await supabaseClient
      .from('website_versions')
      .insert({
        producer_id: userId,
        design_json: JSON.stringify(designData),
        description: description || `Auto-saved at ${new Date().toLocaleString()}`,
        created_at: new Date().toISOString()
      });

    if (error) {
      // Table might not exist yet, which is ok
      if (error.code === '42P01') {
        return { success: true }; // Silently succeed if table doesn't exist
      }
      console.error('Version save error:', error);
      return { success: false, error: 'Failed to save version.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Create version error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

// Export functions for global use
window.editorStorage = {
  saveDesign,
  loadDesign,
  publishSite,
  saveTheme,
  getCurrentUser,
  createVersion
};
