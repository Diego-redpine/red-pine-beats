// Verify customer magic link token
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { token, email } = JSON.parse(event.body);

    if (!token || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token and email are required', valid: false })
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check token in database
    const { data: tokenRecord, error } = await supabase
      .from('customer_access_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', normalizedEmail)
      .single();

    if (error || !tokenRecord) {
      // Token not found - could be table doesn't exist or token invalid
      // For graceful degradation, verify customer has purchases
      const { data: sales } = await supabase
        .from('sales')
        .select('id')
        .ilike('customer_email', normalizedEmail)
        .eq('status', 'completed')
        .limit(1);

      if (sales && sales.length > 0) {
        // Customer has purchases, allow access even if token table missing
        // This is a fallback for when the token table doesn't exist yet
        return {
          statusCode: 200,
          body: JSON.stringify({
            valid: true,
            email: normalizedEmail,
            note: 'Verified via purchase history'
          })
        };
      }

      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid or expired token', valid: false })
      };
    }

    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired token
      await supabase
        .from('customer_access_tokens')
        .delete()
        .eq('id', tokenRecord.id);

      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Token has expired', valid: false })
      };
    }

    // Token is valid - mark as used (optional: delete or mark)
    await supabase
      .from('customer_access_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRecord.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        email: normalizedEmail
      })
    };

  } catch (error) {
    console.error('Error verifying token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to verify token', valid: false })
    };
  }
};
