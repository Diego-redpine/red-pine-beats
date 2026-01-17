// Supabase Edge Function for handling Stripe webhooks
// Records sales and updates beat purchase status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(supabase, session);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
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

async function handleSuccessfulPayment(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata;
  if (!metadata) return;

  const producerId = metadata.producer_id;
  const cartItems = JSON.parse(metadata.cart_items || "[]");

  // Get customer details
  const customerEmail = session.customer_details?.email || session.customer_email || "unknown";
  const customerName = session.customer_details?.name || "Customer";

  // Record each sale
  for (const item of cartItems) {
    // Create sale record
    const { error: saleError } = await supabase.from("sales").insert({
      producer_id: producerId,
      beat_id: item.beat_id,
      customer_email: customerEmail,
      customer_name: customerName,
      license_type: item.license,
      amount: item.price,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      status: "completed",
    });

    if (saleError) {
      console.error("Error recording sale:", saleError);
    }

    // If exclusive license, mark beat as sold
    if (item.license === "Exclusive License") {
      await supabase
        .from("beats")
        .update({ is_sold: true, sold_at: new Date().toISOString() })
        .eq("id", item.beat_id);
    }

    // Increment beat sales count
    await supabase.rpc("increment_beat_sales", { beat_id: item.beat_id });
  }

  // Update producer analytics
  const totalAmount = cartItems.reduce((sum: number, item: { price: number }) => sum + item.price, 0);

  await supabase.rpc("increment_producer_sales", {
    producer_id: producerId,
    amount: totalAmount,
    sale_count: cartItems.length,
  });

  console.log(`Successfully processed payment for session ${session.id}`);
}
