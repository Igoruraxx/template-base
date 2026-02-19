import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an OCR specialist for bioimpedance scale readings. Extract numeric values from the scale display image. Return ONLY a JSON object with these fields (use null if not found):
{
  "weight": number|null,       // kg
  "body_fat_pct": number|null, // %
  "muscle_mass": number|null,  // kg
  "visceral_fat": number|null, // level or index
  "bmr": number|null,          // kcal
  "body_water_pct": number|null, // %
  "bone_mass": number|null     // kg
}
Do NOT include any text outside the JSON. Always use numbers, not strings.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all bioimpedance values from this scale display photo:",
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_bioimpedance",
              description: "Extract bioimpedance values from scale image",
              parameters: {
                type: "object",
                properties: {
                  weight: { type: ["number", "null"], description: "Weight in kg" },
                  body_fat_pct: { type: ["number", "null"], description: "Body fat percentage" },
                  muscle_mass: { type: ["number", "null"], description: "Muscle mass in kg" },
                  visceral_fat: { type: ["number", "null"], description: "Visceral fat level" },
                  bmr: { type: ["number", "null"], description: "BMR in kcal" },
                  body_water_pct: { type: ["number", "null"], description: "Body water percentage" },
                  bone_mass: { type: ["number", "null"], description: "Bone mass in kg" },
                },
                required: ["weight", "body_fat_pct", "muscle_mass", "visceral_fat", "bmr", "body_water_pct", "bone_mass"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_bioimpedance" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    let extracted;
    if (toolCall) {
      extracted = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = result.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        extracted = { weight: null, body_fat_pct: null, muscle_mass: null, visceral_fat: null, bmr: null, body_water_pct: null, bone_mass: null };
      }
    }

    return new Response(JSON.stringify({ data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-bioimpedance error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
