// Supabase Edge Function for creating Stripe Checkout sessions
// Handles beat purchases with proper producer payouts via Stripe Connect

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  beatId: string;
  title: string;
  cover: string | null;
  license: string;
  price: number;
}

interface CheckoutRequest {
  cartItems: CartItem[];
  producerId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cartItems, producerId, customerEmail, successUrl, cancelUrl }: CheckoutRequest = await req.json();

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    if (!producerId) {
      throw new Error("Producer ID is required");
    }

    // Get producer's Stripe Connect account
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const producerResponse = await fetch(
      `${supabaseUrl}/rest/v1/producers?id=eq.${producerId}&select=stripe_account_id,producer_name`,
      {
        headers: {
          "apikey": supabaseKey!,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    const producers = await producerResponse.json();
    const producer = producers[0];

    if (!producer) {
      throw new Error("Producer not found");
    }

    // Create line items for Stripe Checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          description: item.license,
          images: item.cover ? [item.cover] : [],
          metadata: {
            beat_id: item.beatId,
            license_type: item.license,
          },
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: 1,
    }));

    // Calculate total for platform fee
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
    const platformFee = Math.round(totalAmount * 0.10 * 100); // 10% platform fee in cents

    // Create Stripe Checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        producer_id: producerId,
        cart_items: JSON.stringify(cartItems.map(item => ({
          beat_id: item.beatId,
          license: item.license,
          price: item.price
        }))),
      },
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // If producer has Stripe Connect, use application_fee_amount for payouts
    if (producer.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: producer.stripe_account_id,
        },
      };
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

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
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create checkout session",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
