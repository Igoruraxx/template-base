import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { accessCode, paths, bucket } = await req.json();

    if (!accessCode || !paths || !bucket) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["progress-photos", "bioimpedance-reports"].includes(bucket)) {
      return new Response(JSON.stringify({ error: "Invalid bucket" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Validate access code
    const { data: students, error: studentError } = await supabaseAdmin.rpc(
      "get_student_by_code",
      { _code: accessCode }
    );

    if (studentError || !students || students.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid access code" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studentTrainerId = students[0].trainer_id;

    // Validate that all paths belong to this trainer's folder
    const validPaths = (paths as string[]).filter((p: string) => {
      // Extract trainer ID from path (first segment)
      const parts = p.split("/");
      return parts[0] === studentTrainerId;
    });

    // Generate signed URLs
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrls(validPaths, 3600);

    if (signError || !signedData) {
      return new Response(JSON.stringify({ error: "Failed to generate URLs" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signedUrls: Record<string, string> = {};
    signedData.forEach((item, idx) => {
      if (item.signedUrl) {
        signedUrls[validPaths[idx]] = item.signedUrl;
      }
    });

    return new Response(JSON.stringify({ signedUrls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("student-signed-urls error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
