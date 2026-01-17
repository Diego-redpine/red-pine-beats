// Check if a customer email has any purchases
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
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if customer has any purchases in the sales table
    const { data: sales, error } = await supabase
      .from('sales')
      .select('id')
      .ilike('customer_email', normalizedEmail)
      .eq('status', 'completed')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database error' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        hasPurchases: sales && sales.length > 0,
        email: normalizedEmail
      })
    };

  } catch (error) {
    console.error('Error checking purchases:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to check purchases' })
    };
  }
};
