// Supabase Edge Function for creating Stripe Customer Portal sessions

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

interface PortalRequest {
  producerId: string;
  returnUrl: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { producerId, returnUrl }: PortalRequest = await req.json();

    if (!producerId) {
      throw new Error("Producer ID is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get producer's Stripe customer ID
    const { data: producer, error } = await supabase
      .from("producers")
      .select("stripe_customer_id")
      .eq("id", producerId)
      .single();

    if (error || !producer?.stripe_customer_id) {
      throw new Error("No billing account found");
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: producer.stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Portal error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create portal session",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
