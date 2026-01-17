// Send magic link email to customer for portal access
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Store token in database
    // First, delete any existing tokens for this email
    await supabase
      .from('customer_access_tokens')
      .delete()
      .eq('email', normalizedEmail);

    // Insert new token
    const { error: insertError } = await supabase
      .from('customer_access_tokens')
      .insert({
        email: normalizedEmail,
        token,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      });

    // If table doesn't exist, continue anyway (token will be verified via query)
    if (insertError && !insertError.message.includes('does not exist')) {
      console.error('Token insert error:', insertError);
    }

    // Get customer's purchase count for the email
    const { data: sales } = await supabase
      .from('sales')
      .select('id, beats(title)')
      .ilike('customer_email', normalizedEmail)
      .eq('status', 'completed');

    const purchaseCount = sales ? sales.length : 0;

    // Build magic link URL
    const baseUrl = process.env.APP_URL || 'https://redpine.systems';
    const magicLink = `${baseUrl}/customer-login.html?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send email
    await sgMail.send({
      to: normalizedEmail,
      from: 'noreply@redpine.systems',
      subject: 'Your Red Pine Portal Login Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ce0707 0%, #8b0000 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">
              Access Your Purchases
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px; border: 1px solid #eee; border-top: none;">
            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 24px;">
              Click the button below to access your customer portal and download your ${purchaseCount} purchased beat${purchaseCount !== 1 ? 's' : ''}.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" style="background: #ce0707; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Access My Purchases
              </a>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center; margin-bottom: 24px;">
              This link expires in 15 minutes for security.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

            <p style="font-size: 13px; color: #999; line-height: 1.6;">
              If you didn't request this link, you can safely ignore this email.
              Someone may have entered your email address by mistake.
            </p>

            <p style="font-size: 12px; color: #ccc; margin-top: 24px;">
              Can't click the button? Copy this link:<br>
              <span style="color: #999; word-break: break-all;">${magicLink}</span>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 30px; background: #f9f9f9; border: 1px solid #eee; border-top: none; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999;">
              Powered by <a href="https://redpine.systems" style="color: #ce0707; text-decoration: none;">Red Pine</a>
            </p>
          </div>
        </div>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Error sending magic link:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send login link' })
    };
  }
};
