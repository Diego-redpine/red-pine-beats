// Supabase Edge Function for handling Stripe subscription webhooks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET") || "";

// Plan limits and features
const PLAN_CONFIG = {
  starter: {
    max_beats: 25,
    ai_credits: 5,
    has_analytics: true,
    has_custom_domain: false,
  },
  pro: {
    max_beats: 100,
    ai_credits: 20,
    has_analytics: true,
    has_custom_domain: false,
  },
  unlimited: {
    max_beats: -1, // unlimited
    ai_credits: 50,
    has_analytics: true,
    has_custom_domain: true,
  },
};

serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabase, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === "subscription_cycle") {
          await handleSubscriptionRenewal(supabase, invoice);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

async function handleSubscriptionChange(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const producerId = subscription.metadata.producer_id;
  const planId = subscription.metadata.plan_id as keyof typeof PLAN_CONFIG;

  if (!producerId || !planId) {
    console.error("Missing metadata in subscription");
    return;
  }

  const planConfig = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;

  // Update producer subscription status
  await supabase
    .from("producers")
    .update({
      subscription_status: subscription.status,
      subscription_plan: planId,
      subscription_id: subscription.id,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      max_beats: planConfig.max_beats,
      ai_credits_monthly: planConfig.ai_credits,
      has_custom_domain: planConfig.has_custom_domain,
      updated_at: new Date().toISOString(),
    })
    .eq("id", producerId);

  // Reset AI credits on new subscription
  if (subscription.status === "active") {
    await supabase
      .from("producers")
      .update({
        ai_credits_remaining: planConfig.ai_credits,
        ai_credits_reset_at: new Date().toISOString(),
      })
      .eq("id", producerId);
  }

  console.log(`Subscription ${subscription.status} for producer ${producerId}, plan: ${planId}`);
}

async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const producerId = subscription.metadata.producer_id;

  if (!producerId) return;

  // Downgrade to free tier
  await supabase
    .from("producers")
    .update({
      subscription_status: "canceled",
      subscription_plan: "free",
      subscription_id: null,
      subscription_current_period_end: null,
      max_beats: 10, // Free tier limit
      ai_credits_monthly: 3,
      has_custom_domain: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", producerId);

  console.log(`Subscription canceled for producer ${producerId}`);
}

async function handleSubscriptionRenewal(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const producerId = subscription.metadata.producer_id;
  const planId = subscription.metadata.plan_id as keyof typeof PLAN_CONFIG;

  if (!producerId) return;

  const planConfig = PLAN_CONFIG[planId] || PLAN_CONFIG.starter;

  // Reset monthly AI credits
  await supabase
    .from("producers")
    .update({
      ai_credits_remaining: planConfig.ai_credits,
      ai_credits_reset_at: new Date().toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("id", producerId);

  console.log(`Subscription renewed for producer ${producerId}`);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  // Get producer by customer ID
  const { data: producer } = await supabase
    .from("producers")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!producer) return;

  // Update status to past_due
  await supabase
    .from("producers")
    .update({
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("id", producer.id);

  console.log(`Payment failed for producer ${producer.id}`);
}
