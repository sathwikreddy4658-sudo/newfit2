import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!url || !key) {
      return new Response(JSON.stringify({ error: "Config missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = createClient(url, key);
    const form = await req.formData();
    
    const file = form.get("file") as File;
    const fileName = form.get("fileName") as string;
    const productId = form.get("productId") as string;
    const testType = form.get("testType") as string;
    const testDate = form.get("testDate") as string;

    if (!file || !fileName || !productId) {
      return new Response(JSON.stringify({ error: "Missing required fields (file, fileName, productId)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = await file.arrayBuffer();
    
    const upRes = await client.storage
      .from("lab-reports")
      .upload(fileName, new Uint8Array(buf), { upsert: false });

    if (upRes.error) {
      return new Response(JSON.stringify({ error: upRes.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url_res = client.storage.from("lab-reports").getPublicUrl(fileName);
    
    const dbRes = await client.from("lab_reports").insert({
      product_id: productId,
      file_url: url_res.data.publicUrl,
      file_name: file.name,
      file_size: buf.byteLength,
      test_type: testType || null,
      test_date: testDate || null,
    });

    if (dbRes.error) {
      await client.storage.from("lab-reports").remove([fileName]);
      return new Response(JSON.stringify({ error: dbRes.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: { fileName, productId, testType, testDate }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
