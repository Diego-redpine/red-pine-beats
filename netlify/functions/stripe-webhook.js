// Netlify Function: Handle Stripe Webhooks
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  
  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' })
    };
  }

  // Handle different event types
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(stripeEvent.data.object);
      break;
      
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', stripeEvent.data.object.id);
      break;
      
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', stripeEvent.data.object.id);
      await handlePaymentFailed(stripeEvent.data.object);
      break;
      
    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};

async function handleCheckoutComplete(session) {
  try {
    const {
      id: sessionId,
      amount_total,
      customer_email,
      customer_details,
      metadata,
      payment_intent
    } = session;

    console.log('Processing completed checkout:', sessionId);

    // STORE-034: Handle AI credits purchase
    if (metadata.type === 'ai_credits') {
      await handleAICreditsPurchase(metadata.producer_id, parseInt(metadata.credits));
      return;
    }

    const {
      beat_id,
      license_type,
      producer_id,
      customer_name
    } = metadata;

    // Record sale in database
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([{
        beat_id,
        producer_id,
        amount: amount_total,
        license_type,
        customer_email: customer_email || customer_details?.email,
        customer_name: customer_name || customer_details?.name,
        stripe_session_id: sessionId,
        stripe_payment_intent_id: payment_intent,
        status: 'completed',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (saleError) {
      console.error('Error recording sale:', saleError);
      throw saleError;
    }

    console.log('Sale recorded:', sale.id);

    // Get beat details for email
    const { data: beat } = await supabase
      .from('beats')
      .select('*, producer:producers(name, email)')
      .eq('id', beat_id)
      .single();

    // Send email to customer with download link
    await sendCustomerEmail({
      to: customer_email || customer_details?.email,
      customerName: customer_name || customer_details?.name,
      beat,
      license_type,
      saleId: sale.id
    });

    // Send notification to producer
    await sendProducerNotification({
      producerEmail: beat.producer.email,
      producerName: beat.producer.name,
      beat,
      customerEmail: customer_email || customer_details?.email,
      amount: amount_total
    });

    // NOTIF-002: Create in-app notification for sale
    await createNotification({
      producer_id,
      type: 'sale',
      title: 'New Sale',
      message: `${customer_name || customer_email || 'A customer'} purchased "${beat.title}" for $${(amount_total / 100).toFixed(2)}`,
      data: {
        beat_id,
        sale_id: sale.id,
        amount: amount_total,
        license_type
      }
    });

    // NOTIF-002: Create notification for new customer (if first purchase)
    const { data: existingPurchases } = await supabase
      .from('sales')
      .select('id')
      .eq('producer_id', producer_id)
      .eq('customer_email', customer_email || customer_details?.email);

    if (existingPurchases && existingPurchases.length === 1) {
      await createNotification({
        producer_id,
        type: 'new_customer',
        title: 'New Customer',
        message: `${customer_name || customer_email || 'A new customer'} made their first purchase!`,
        data: {
          customer_email: customer_email || customer_details?.email,
          customer_name
        }
      });
    }

    // Update beat statistics
    await supabase
      .from('beats')
      .update({
        sales_count: beat.sales_count ? beat.sales_count + 1 : 1
      })
      .eq('id', beat_id);

    console.log('Checkout processing complete');

  } catch (error) {
    console.error('Error handling checkout completion:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed, sending notification...');
  // TODO: Notify producer of failed payment
}

async function sendCustomerEmail({ to, customerName, beat, license_type, saleId }) {
  try {
    // Using SendGrid API
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const downloadLink = `${process.env.URL}/download/${saleId}`;
    
    const licenseNames = {
      basic: 'Basic Lease',
      premium: 'Premium Lease',
      exclusive: 'Exclusive Rights'
    };

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Your Beat Purchase: ${beat.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #CE0707; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: #CE0707; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Purchase!</h1>
            </div>
            <div class="content">
              <p>Hi ${customerName || 'there'},</p>
              
              <p>Your payment was successful! You've purchased:</p>
              
              <h2>${beat.title}</h2>
              <p><strong>License:</strong> ${licenseNames[license_type]}</p>
              <p><strong>Producer:</strong> ${beat.producer.name}</p>
              
              <p>The producer will send you the full untagged files within 24 hours.</p>
              
              <p style="margin-top: 30px;">
                <a href="${downloadLink}" class="button">View License Agreement</a>
              </p>
              
              <p>If you have any questions, please contact the producer directly.</p>
              
              <p>Best regards,<br>Red Pine Team</p>
            </div>
            <div class="footer">
              <p>Powered by Red Pine • © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);
    console.log('Customer email sent to:', to);

  } catch (error) {
    console.error('Error sending customer email:', error);
  }
}

async function sendProducerNotification({ producerEmail, producerName, beat, customerEmail, amount }) {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: producerEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `New Sale: ${beat.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #CE0707; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .amount { font-size: 32px; color: #CE0707; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You Made a Sale!</h1>
            </div>
            <div class="content">
              <p>Hi ${producerName},</p>
              
              <div class="amount">$${(amount / 100).toFixed(2)}</div>
              
              <p><strong>Beat:</strong> ${beat.title}</p>
              <p><strong>Customer:</strong> ${customerEmail}</p>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Send the untagged files to the customer within 24 hours</li>
                <li>The payment will appear in your Stripe account within 2-7 business days</li>
              </ol>
              
              <p>Keep up the great work!</p>
              
              <p>Best,<br>Red Pine Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);
    console.log('Producer notification sent to:', producerEmail);

  } catch (error) {
    console.error('Error sending producer notification:', error);
  }
}

// STORE-034: Handle AI credits purchase
async function handleAICreditsPurchase(producerId, credits) {
  try {
    // Get current credits limit
    const { data: producer } = await supabase
      .from('producers')
      .select('ai_credits_limit')
      .eq('id', producerId)
      .single();

    const currentLimit = producer?.ai_credits_limit || 10;
    const newLimit = currentLimit + credits;

    // Update producer's AI credits limit
    await supabase
      .from('producers')
      .update({ ai_credits_limit: newLimit })
      .eq('id', producerId);

    // Create notification
    await createNotification({
      producer_id: producerId,
      type: 'ai_credits',
      title: 'AI Credits Added',
      message: `${credits} AI credits have been added to your account!`,
      data: { credits_added: credits, new_limit: newLimit }
    });

    console.log(`Added ${credits} AI credits to producer ${producerId}`);

  } catch (error) {
    console.error('Error adding AI credits:', error);
    throw error;
  }
}

// NOTIF-002: Create in-app notification
async function createNotification({ producer_id, type, title, message, data }) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        producer_id,
        type,
        title,
        message,
        data,
        is_read: false,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error creating notification:', error);
    } else {
      console.log('Notification created:', type);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
