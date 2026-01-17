// NOTIF-004: Weekly email report
// This function runs weekly via Netlify scheduled functions
// Configure in netlify.toml: [functions.weekly-report] schedule = "@weekly"

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
  console.log('Starting weekly report generation...');

  try {
    // Get all active producers
    const { data: producers, error: producerError } = await supabase
      .from('producers')
      .select('id, email, name')
      .eq('subscription_status', 'active');

    if (producerError) throw producerError;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    for (const producer of producers) {
      try {
        // Get this week's stats
        const { data: thisWeekSales } = await supabase
          .from('sales')
          .select('amount')
          .eq('producer_id', producer.id)
          .gte('created_at', oneWeekAgo.toISOString())
          .lt('created_at', now.toISOString());

        const { data: lastWeekSales } = await supabase
          .from('sales')
          .select('amount')
          .eq('producer_id', producer.id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString());

        // Get new customers
        const { data: thisWeekCustomers } = await supabase
          .from('customers')
          .select('id')
          .eq('producer_id', producer.id)
          .gte('created_at', oneWeekAgo.toISOString());

        const { data: lastWeekCustomers } = await supabase
          .from('customers')
          .select('id')
          .eq('producer_id', producer.id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString());

        // Calculate metrics
        const thisWeekRevenue = (thisWeekSales || []).reduce((sum, s) => sum + (s.amount || 0), 0);
        const lastWeekRevenue = (lastWeekSales || []).reduce((sum, s) => sum + (s.amount || 0), 0);
        const thisWeekSalesCount = (thisWeekSales || []).length;
        const lastWeekSalesCount = (lastWeekSales || []).length;
        const thisWeekNewCustomers = (thisWeekCustomers || []).length;
        const lastWeekNewCustomers = (lastWeekCustomers || []).length;

        // Calculate changes
        const revenueChange = lastWeekRevenue > 0
          ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
          : thisWeekRevenue > 0 ? 100 : 0;
        const salesChange = lastWeekSalesCount > 0
          ? ((thisWeekSalesCount - lastWeekSalesCount) / lastWeekSalesCount * 100).toFixed(1)
          : thisWeekSalesCount > 0 ? 100 : 0;
        const customerChange = lastWeekNewCustomers > 0
          ? ((thisWeekNewCustomers - lastWeekNewCustomers) / lastWeekNewCustomers * 100).toFixed(1)
          : thisWeekNewCustomers > 0 ? 100 : 0;

        // Create notification record
        await supabase
          .from('notifications')
          .insert([{
            producer_id: producer.id,
            type: 'weekly_report',
            title: 'Your Weekly Report',
            message: `Revenue: $${(thisWeekRevenue / 100).toFixed(2)} (${revenueChange >= 0 ? '+' : ''}${revenueChange}%), Sales: ${thisWeekSalesCount} (${salesChange >= 0 ? '+' : ''}${salesChange}%), New Customers: ${thisWeekNewCustomers}`,
            read: false
          }]);

        // Send email via Supabase Edge Function or external email service
        // In production, integrate with SendGrid, Resend, or similar
        console.log(`Weekly report generated for ${producer.email}:`, {
          revenue: thisWeekRevenue,
          sales: thisWeekSalesCount,
          newCustomers: thisWeekNewCustomers
        });

      } catch (error) {
        console.error(`Error generating report for ${producer.email}:`, error);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Weekly reports generated for ${producers.length} producers` })
    };

  } catch (error) {
    console.error('Weekly report error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
