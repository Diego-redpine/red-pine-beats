// Supabase Edge Function for creating Stripe subscription checkout sessions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Red Pine subscription plans
const PLANS = {
  starter: {
    name: "Starter",
    price_id: Deno.env.get("STRIPE_STARTER_PRICE_ID") || "price_starter",
    features: ["Up to 25 beats", "Basic analytics", "Standard support"],
  },
  pro: {
    name: "Pro",
    price_id: Deno.env.get("STRIPE_PRO_PRICE_ID") || "price_pro",
    features: ["Up to 100 beats", "Advanced analytics", "AI design credits (20/mo)", "Priority support"],
  },
  unlimited: {
    name: "Unlimited",
    price_id: Deno.env.get("STRIPE_UNLIMITED_PRICE_ID") || "price_unlimited",
    features: ["Unlimited beats", "Full analytics suite", "AI design credits (50/mo)", "Priority support", "Custom domain"],
  },
};

interface SubscriptionRequest {
  planId: "starter" | "pro" | "unlimited";
  producerId: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planId, producerId, successUrl, cancelUrl }: SubscriptionRequest = await req.json();

    if (!planId || !PLANS[planId]) {
      throw new Error("Invalid plan ID");
    }

    if (!producerId) {
      throw new Error("Producer ID is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get producer details
    const { data: producer, error: producerError } = await supabase
      .from("producers")
      .select("email, stripe_customer_id")
      .eq("id", producerId)
      .single();

    if (producerError || !producer) {
      throw new Error("Producer not found");
    }

    let customerId = producer.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: producer.email,
        metadata: {
          producer_id: producerId,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from("producers")
        .update({ stripe_customer_id: customerId })
        .eq("id", producerId);
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: PLANS[planId].price_id,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        producer_id: producerId,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          producer_id: producerId,
          plan_id: planId,
        },
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Subscription error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create subscription",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
