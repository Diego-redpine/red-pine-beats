// Netlify Function: Process Refund
// STRIPE-008: Refund management
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
    const { saleId, reason } = JSON.parse(event.body);

    if (!saleId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Sale ID is required' })
      };
    }

    // Get sale details
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*, beats(title, producer_id)')
      .eq('id', saleId)
      .single();

    if (saleError || !sale) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Sale not found' })
      };
    }

    if (sale.status === 'refunded') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'This sale has already been refunded' })
      };
    }

    // Process refund via Stripe
    if (sale.stripe_payment_intent_id) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: sale.stripe_payment_intent_id,
          reason: reason === 'fraudulent' ? 'fraudulent' :
                  reason === 'duplicate' ? 'duplicate' :
                  'requested_by_customer'
        });

        console.log('Stripe refund created:', refund.id);
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Stripe refund failed: ' + stripeError.message })
        };
      }
    }

    // Update sale status in database
    const { error: updateError } = await supabase
      .from('sales')
      .update({
        status: 'refunded',
        refund_reason: reason,
        refunded_at: new Date().toISOString()
      })
      .eq('id', saleId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update sale status' })
      };
    }

    // Create notification for producer
    await supabase
      .from('notifications')
      .insert([{
        producer_id: sale.beats.producer_id,
        type: 'refund',
        title: 'Refund Processed',
        message: `A refund of $${(sale.amount / 100).toFixed(2)} was processed for "${sale.beats.title}"`,
        data: {
          sale_id: saleId,
          amount: sale.amount,
          reason
        },
        is_read: false,
        created_at: new Date().toISOString()
      }]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Refund processed successfully'
      })
    };

  } catch (error) {
    console.error('Refund processing error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process refund',
        message: error.message
      })
    };
  }
};
