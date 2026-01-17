// Netlify Function: Buy AI Credits
// STORE-034: AI credits purchase system
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { producerId, credits, priceInCents } = JSON.parse(event.body);

    // Validate input
    const validPrices = {
      10: 1000,   // 10 credits for $10
      50: 4000,   // 50 credits for $40
      100: 7000   // 100 credits for $70
    };

    if (!validPrices[credits] || validPrices[credits] !== priceInCents) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid credit package' })
      };
    }

    // Get producer info
    const { data: producer, error: producerError } = await supabase
      .from('producers')
      .select('email, name')
      .eq('id', producerId)
      .single();

    if (producerError || !producer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Producer not found' })
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: producer.email,
      client_reference_id: producerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${credits} AI Credits`,
            description: `Add ${credits} AI design assistant requests to your account`
          },
          unit_amount: priceInCents
        },
        quantity: 1
      }],
      metadata: {
        producer_id: producerId,
        credits: credits,
        type: 'ai_credits'
      },
      success_url: `${process.env.URL}/customize.html?ai_credits_purchased=${credits}`,
      cancel_url: `${process.env.URL}/customize.html?ai_credits_cancelled=true`
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };

  } catch (error) {
    console.error('AI credits purchase error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        message: error.message
      })
    };
  }
};
