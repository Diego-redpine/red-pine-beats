// AUTH-004: Verify subscription payment and create account
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { sessionId } = JSON.parse(event.body);

    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing session ID' })
      };
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payment not completed' })
      };
    }

    // Check if already processed
    const { data: existingProducer } = await supabase
      .from('producers')
      .select('id')
      .eq('email', session.metadata.email)
      .single();

    if (existingProducer) {
      // Already created, just return success
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Account already exists',
          email: session.metadata.email,
          password: Buffer.from(session.metadata.password, 'base64').toString()
        })
      };
    }

    // Create the user account
    const { name, username, email, password: encodedPassword } = session.metadata;
    const password = Buffer.from(encodedPassword, 'base64').toString();

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create user account' })
      };
    }

    // Create producer record
    const { error: producerError } = await supabase
      .from('producers')
      .insert([{
        email,
        username,
        name,
        subdomain: username,
        subscription_status: 'active',
        subscription_id: session.subscription,
        monthly_fee: 4500,
        stripe_customer_id: session.customer
      }]);

    if (producerError) {
      console.error('Producer creation error:', producerError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create producer record' })
      };
    }

    // Create default site customization
    await supabase
      .from('site_customizations')
      .insert([{
        producer_id: authData.user.id,
        template_id: 'gradient-hero',
        primary_color: '#FF8C42',
        accent_color: '#40E0D0',
        font_heading: 'Oswald',
        font_body: 'Inter'
      }]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        email,
        password
      })
    };

  } catch (error) {
    console.error('Verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
