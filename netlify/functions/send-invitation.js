// RPB-115 to RPB-118: Send customer invitation email
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    const { email, producerId, storeName, storeUrl } = JSON.parse(event.body);

    if (!email || !producerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Generate unique token
    const token = require('crypto').randomUUID();

    // Store invitation in database
    const { error: dbError } = await supabase
      .from('customer_invitations')
      .insert({
        email,
        producer_id: producerId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database error' })
      };
    }

    // Build invitation URL
    const inviteUrl = storeUrl + '/signup?invite=' + token;

    // Send email via SendGrid
    await sgMail.send({
      to: email,
      from: 'noreply@redpine.systems',
      subject: "You're invited to " + storeName,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #111;">You've been invited!</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            ${storeName} wants you to join their beat store on Red Pine.
          </p>
          <p style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background: #ce0707; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Accept Invitation
            </a>
          </p>
          <p style="font-size: 14px; color: #666;">
            This invitation will expire in 7 days.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">
            Powered by <a href="https://redpine.systems" style="color: #ce0707;">Red Pine</a>
          </p>
        </div>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Error sending invitation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send invitation' })
    };
  }
};
