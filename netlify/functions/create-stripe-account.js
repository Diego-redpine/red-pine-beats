// RPB-166 to RPB-168: Create Stripe Express account for producers
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
    const { userId, email } = JSON.parse(event.body);

    if (!userId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });

    // Save Stripe account ID to producer record
    const { error: dbError } = await supabase
      .from('producers')
      .update({ stripe_account_id: account.id })
      .eq('user_id', userId);

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway - account was created
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://beats.redpine.systems/settings?stripe=refresh',
      return_url: 'https://beats.redpine.systems/settings?stripe=success',
      type: 'account_onboarding'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: accountLink.url })
    };

  } catch (error) {
    console.error('Error creating Stripe account:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create Stripe account' })
    };
  }
};
