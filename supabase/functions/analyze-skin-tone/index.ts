import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { imageBase64, analysisType } = body;

    // Input validation
    if (!analysisType || !['image'].includes(analysisType)) {
      return new Response(JSON.stringify({ error: 'Invalid analysis type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'Image data is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // Validate it looks like base64 data URI or reasonable base64 string (max ~10MB)
    if (imageBase64.length > 15_000_000) {
      return new Response(JSON.stringify({ error: 'Image data too large' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!imageBase64.startsWith('data:image/')) {
      return new Response(JSON.stringify({ error: 'Invalid image format - must be a data URI' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let prompt = '';
    let responseSchema: any = null;

    if (analysisType === 'image') {
      prompt = "Analyze ONLY the facial skin tone in this image. CRITICAL INSTRUCTIONS:\n\n1. EXCLUDE these areas completely:\n   - Hair (scalp, facial hair, eyebrows)\n   - Eyes and lips\n   - Any non-skin areas\n\n2. For LIGHTEST tone:\n   - Focus on forehead, nose bridge, or under-eye areas\n   - Choose naturally light areas, NOT highlights or reflections\n   - Must be actual skin, not hair or background\n\n3. For DARKEST tone:\n   - Focus on lower cheek area near jawline or temples\n   - Choose naturally darker facial skin areas\n   - Must be actual skin tone, NOT shadows, hair, or facial hair\n   - The darkest FACIAL SKIN area, not the darkest thing in the image\n\nReturn exact hexadecimal color codes for both tones. Ensure both colors represent actual facial skin, with darkest being from the lower cheek/jawline area.";
      responseSchema = {
        type: "object",
        properties: {
          lightest_hex: { type: "string", description: "The hexadecimal color code (#RRGGBB format) of the lightest facial skin tone area (forehead, nose bridge, or under-eye)" },
          darkest_hex: { type: "string", description: "The hexadecimal color code (#RRGGBB format) of the darkest facial skin tone area (lower cheek near jawline or temples, NOT hair)" }
        },
        required: ["lightest_hex", "darkest_hex"]
      };
    }

    const payload: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ]
    };

    if (responseSchema) {
      payload.response_format = {
        type: "json_schema",
        json_schema: {
          name: "skin_tone_analysis",
          schema: responseSchema
        }
      };
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-skin-tone:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
