// Supabase Edge Function for AI Design Assistant
// Uses Claude API to help users customize their store

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DesignRequest {
  message: string;
  currentStore: Record<string, any>;
  producerName: string;
}

const SYSTEM_PROMPT = `You are an AI design assistant for Red Pine, a platform for music producers to create custom beat stores.

Your role is to help users customize their store by understanding their requests and suggesting specific CSS/design changes.

You have access to these store properties that you can modify:
- template: 'gradient-hero' | 'dark-minimal' | 'clean-modern'
- primary_color: hex color (e.g., '#CE0707')
- secondary_color: hex color
- hero_bg_color: hex color or gradient
- hero_text_color: hex color
- heading_font: font name (Oswald, Poppins, Bebas Neue, Montserrat, Inter, Roboto, Playfair Display, Anton, Staatliches)
- body_font: font name
- header_bg_color: hex color
- footer_bg_color: hex color
- hero_title: text
- hero_subtitle: text
- hero_bio: text

When a user asks for a change, respond in JSON format with:
1. "message": A friendly explanation of what you're changing (1-2 sentences)
2. "changes": An object with the specific property changes to apply (can be null if just answering a question)

Example response:
{
  "message": "I'll give your store a sleek dark theme! This creates a professional, modern look that really makes your beats pop.",
  "changes": {
    "template": "dark-minimal",
    "primary_color": "#10B981",
    "hero_bg_color": "#000000",
    "header_bg_color": "#111111",
    "footer_bg_color": "#111111"
  }
}

Design principles to follow:
- Maintain good contrast for readability
- Suggest complementary colors
- Keep the aesthetic professional and suitable for music producers
- Be enthusiastic but concise
- Always explain why a change will look good

If the user's request is unclear, ask a clarifying question but still provide a reasonable default suggestion.`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const { message, currentStore, producerName }: DesignRequest = await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    // Create context about the current store
    const storeContext = `
Current store settings for ${producerName || 'the producer'}:
- Template: ${currentStore?.template || 'gradient-hero'}
- Primary color: ${currentStore?.primary_color || '#CE0707'}
- Hero background: ${currentStore?.hero_bg_color || 'gradient'}
- Heading font: ${currentStore?.heading_font || 'Oswald'}
- Body font: ${currentStore?.body_font || 'Inter'}
`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `${storeContext}\n\nUser request: ${message}\n\nRespond with JSON only.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;

    // Parse the JSON response from Claude
    let parsedResponse;
    try {
      // Extract JSON from the response (in case Claude adds extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      // If parsing fails, return a generic response
      parsedResponse = {
        message: aiResponse,
        changes: null,
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        message: "Sorry, I encountered an error. Please try again.",
        changes: null,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
