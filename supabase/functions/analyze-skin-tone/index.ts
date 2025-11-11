import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, analysisType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let prompt = '';
    let responseSchema: any = null;

    if (analysisType === 'image') {
      prompt = "Analyze the skin tone in the provided image. Provide the exact hexadecimal color codes for the lightest, non-highlighted skin tone, and the darkest, non-shadowed skin tone. Return only valid JSON with 'lightest_hex' and 'darkest_hex' properties.";
      responseSchema = {
        type: "object",
        properties: {
          lightest_hex: { type: "string", description: "The hexadecimal color code (#RRGGBB format) of the lightest skin tone area" },
          darkest_hex: { type: "string", description: "The hexadecimal color code (#RRGGBB format) of the darkest skin tone area" }
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
    console.error('Error in analyze-skin-tone:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
