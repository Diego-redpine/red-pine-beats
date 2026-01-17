// Direct Send feature - Send beats directly to customers via email
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
    const {
      beatId,
      customerEmail,
      customerName,
      message,
      producerId,
      producerName,
      storeUrl
    } = JSON.parse(event.body);

    // Validate required fields
    if (!beatId || !customerEmail || !producerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: beatId, customerEmail, producerId' })
      };
    }

    // Fetch beat details
    const { data: beat, error: beatError } = await supabase
      .from('beats')
      .select('*')
      .eq('id', beatId)
      .eq('producer_id', producerId)
      .single();

    if (beatError || !beat) {
      console.error('Beat fetch error:', beatError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Beat not found or access denied' })
      };
    }

    // Generate unique access token for tracking
    const token = require('crypto').randomUUID();

    // Store send record in database (optional - create table if needed)
    try {
      await supabase.from('beat_sends').insert({
        beat_id: beatId,
        producer_id: producerId,
        customer_email: customerEmail,
        customer_name: customerName || null,
        message: message || null,
        token,
        sent_at: new Date().toISOString()
      });
    } catch (dbErr) {
      // Table might not exist yet, continue anyway
      console.log('beat_sends table may not exist, continuing:', dbErr.message);
    }

    // Format prices (stored in cents)
    const formatPrice = (cents) => cents ? '$' + (cents / 100).toFixed(2) : null;
    const basicPrice = formatPrice(beat.price_basic);
    const premiumPrice = formatPrice(beat.price_premium);
    const exclusivePrice = formatPrice(beat.price_exclusive);

    // Build purchase URL
    const checkoutBase = storeUrl || 'https://redpine.systems';
    const purchaseUrl = `${checkoutBase}/checkout.html?beat=${beatId}`;

    // Build email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ce0707 0%, #8b0000 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${producerName || 'A Producer'} sent you a beat!
          </h1>
        </div>

        <!-- Beat Preview -->
        <div style="padding: 30px; border: 1px solid #eee; border-top: none;">
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <!-- Cover Art -->
            <div style="flex-shrink: 0;">
              ${beat.cover_art_url
                ? `<img src="${beat.cover_art_url}" alt="${beat.title}" style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover;">`
                : `<div style="width: 120px; height: 120px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 40px;">🎵</span>
                   </div>`
              }
            </div>

            <!-- Beat Info -->
            <div style="flex: 1;">
              <h2 style="margin: 0 0 8px 0; color: #111; font-size: 20px;">${beat.title}</h2>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">
                ${beat.genre || 'Beat'} ${beat.bpm ? '• ' + beat.bpm + ' BPM' : ''} ${beat.key ? '• Key: ' + beat.key : ''}
              </p>
              ${beat.audio_preview_url ? `
                <p style="margin: 12px 0 0 0;">
                  <a href="${beat.audio_preview_url}" style="color: #ce0707; font-size: 14px; text-decoration: none;">
                    ▶ Listen to Preview
                  </a>
                </p>
              ` : ''}
            </div>
          </div>

          ${message ? `
            <!-- Producer Message -->
            <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; color: #333; font-style: italic; line-height: 1.6;">
                "${message}"
              </p>
              <p style="margin: 8px 0 0 0; color: #666; font-size: 13px;">
                — ${producerName || 'The Producer'}
              </p>
            </div>
          ` : ''}

          <!-- Pricing -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #111; font-size: 16px;">License Options:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${basicPrice ? `
                <tr>
                  <td style="padding: 8px 0; color: #333;">Basic License</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111;">${basicPrice}</td>
                </tr>
              ` : ''}
              ${premiumPrice ? `
                <tr>
                  <td style="padding: 8px 0; color: #333; border-top: 1px solid #eee;">Premium License</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111; border-top: 1px solid #eee;">${premiumPrice}</td>
                </tr>
              ` : ''}
              ${exclusivePrice ? `
                <tr>
                  <td style="padding: 8px 0; color: #333; border-top: 1px solid #eee;">Exclusive License</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ce0707; border-top: 1px solid #eee;">${exclusivePrice}</td>
                </tr>
              ` : ''}
            </table>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${purchaseUrl}" style="background: #ce0707; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              View Beat & Purchase
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background: #f9f9f9; border: 1px solid #eee; border-top: none;">
          <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
            Sent via <a href="https://redpine.systems" style="color: #ce0707; text-decoration: none;">Red Pine</a> •
            The platform for beat producers
          </p>
        </div>
      </div>
    `;

    // Send email via SendGrid
    await sgMail.send({
      to: customerEmail,
      from: 'noreply@redpine.systems',
      subject: `${producerName || 'A producer'} sent you "${beat.title}"`,
      html: emailHtml
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Beat sent successfully',
        token
      })
    };

  } catch (error) {
    console.error('Error sending beat:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send beat: ' + error.message })
    };
  }
};
