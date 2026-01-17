// Netlify Function: Create Stripe Checkout Session
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
    const { beatId, licenseType, customerEmail, customerName, discountCode } = JSON.parse(event.body);

    // Get beat details from database
    const { data: beat, error: beatError } = await supabase
      .from('beats')
      .select('*, producer:producers(stripe_account_id, name, email)')
      .eq('id', beatId)
      .single();

    if (beatError || !beat) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Beat not found' })
      };
    }

    // Check if producer has Stripe connected
    if (!beat.producer.stripe_account_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Producer has not set up payments' })
      };
    }

    // Determine price based on license type
    let priceInCents;
    let licenseName;
    
    switch (licenseType) {
      case 'basic':
        priceInCents = beat.price_basic;
        licenseName = 'Basic Lease';
        break;
      case 'premium':
        priceInCents = beat.price_premium || beat.price_basic;
        licenseName = 'Premium Lease';
        break;
      case 'exclusive':
        priceInCents = beat.price_exclusive || beat.price_basic;
        licenseName = 'Exclusive Rights';
        break;
      default:
        priceInCents = beat.price_basic;
        licenseName = 'Basic Lease';
    }

    if (!priceInCents || priceInCents < 50) { // Stripe minimum is $0.50
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid price' })
      };
    }

    // STRIPE-006: Check for discount code
    let discountApplied = null;
    let stripePromoCodeId = null;

    if (discountCode) {
      // Look up discount code in database
      const { data: discount } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('producer_id', beat.producer_id)
        .eq('is_active', true)
        .single();

      if (discount) {
        // Check if code is still valid
        const now = new Date();
        const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
        const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;
        const usageLimit = discount.usage_limit || Infinity;

        if (
          (!validFrom || now >= validFrom) &&
          (!validUntil || now <= validUntil) &&
          discount.times_used < usageLimit
        ) {
          discountApplied = discount;

          // If producer has a Stripe coupon ID, use it
          if (discount.stripe_coupon_id) {
            stripePromoCodeId = discount.stripe_coupon_id;
          } else {
            // Apply discount manually by reducing price
            if (discount.type === 'percentage') {
              priceInCents = Math.round(priceInCents * (1 - discount.amount / 100));
            } else if (discount.type === 'fixed') {
              priceInCents = Math.max(50, priceInCents - discount.amount); // Min $0.50
            }
          }

          // Increment usage count
          await supabase
            .from('discount_codes')
            .update({ times_used: discount.times_used + 1 })
            .eq('id', discount.id);
        }
      }
    }

    // Create Stripe Checkout Session with Connect
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: beatId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${beat.title} - ${licenseName}`,
            description: `${beat.bpm} BPM • ${beat.key || 'N/A'} • ${beat.genre || 'Beat'}`,
            images: beat.cover_art_url ? [beat.cover_art_url] : []
          },
          unit_amount: priceInCents
        },
        quantity: 1
      }],
      metadata: {
        beat_id: beatId,
        license_type: licenseType,
        producer_id: beat.producer_id,
        customer_name: customerName || 'Customer',
        discount_code: discountApplied ? discountApplied.code : null,
        discount_amount: discountApplied ? discountApplied.amount : null
      },
      // STRIPE-006: Allow promotion codes if no manual discount applied
      allow_promotion_codes: !discountApplied,
      // Apply Stripe coupon if available
      ...(stripePromoCodeId && { discounts: [{ coupon: stripePromoCodeId }] }),
      success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}&beat=${beatId}`,
      cancel_url: `${process.env.URL}/store.html?producer=${beat.producer.subdomain}`,
      
      // CRITICAL: Use Stripe Connect to pay producer directly
      payment_intent_data: {
        application_fee_amount: 0, // Red Pine takes 0% commission
        transfer_data: {
          destination: beat.producer.stripe_account_id
        }
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
        discountApplied: discountApplied ? {
          code: discountApplied.code,
          type: discountApplied.type,
          amount: discountApplied.amount
        } : null
      })
    };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
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
