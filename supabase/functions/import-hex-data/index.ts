import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// HEX to Lab conversion function
function hexToLab(hex: string): { l: number; a: number; b: number } {
  // Convert HEX to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  // Convert RGB to XYZ
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const rLinear = toLinear(r)
  const gLinear = toLinear(g)
  const bLinear = toLinear(b)

  const x = (rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375) * 100
  const y = (rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750) * 100
  const z = (rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041) * 100

  // Convert XYZ to Lab
  const xn = 95.047, yn = 100.000, zn = 108.883
  const fx = x / xn > 0.008856 ? Math.pow(x / xn, 1/3) : (7.787 * (x / xn) + 16/116)
  const fy = y / yn > 0.008856 ? Math.pow(y / yn, 1/3) : (7.787 * (y / yn) + 16/116)
  const fz = z / zn > 0.008856 ? Math.pow(z / zn, 1/3) : (7.787 * (z / zn) + 16/116)

  const L = 116 * fy - 16
  const A = 500 * (fx - fy)
  const B = 200 * (fy - fz)

  return { l: L, a: A, b: B }
}

// Classify undertone from Lab values
function classifyUndertone(a: number, b: number): string {
  if (a > 3 && b > 8) return 'Warm'
  if (a < -1 && b < 5) return 'Cool'
  if (a > 2 && b < 8) return 'Olive'
  return 'Neutral'
}

// Get depth category from L value
function getDepthCategory(l: number): string {
  if (l < 20) return 'Very Deep'
  if (l < 35) return 'Deep'
  if (l < 50) return 'Medium Deep'
  if (l < 65) return 'Medium'
  if (l < 80) return 'Light Medium'
  return 'Light'
}

const SKIN_HEX_VALUES = [
  '#1A0D00', '#1E0F00', '#260701', '#3B2219', '#3C2004', '#3C2E28', '#3D0C02', '#4F2903',
  '#6D3800', '#6F4F1D', '#7C501A', '#843722', '#85646D', '#876127', '#87675A', '#8D5524',
  '#926A2D', '#9C7248', '#A16E4B', '#A77D7B', '#AF6E51', '#B48A78', '#BD8966', '#C19484',
  '#C68642', '#C69076', '#C69876', '#CB9F78', '#D2A469', '#D2A784', '#D39972', '#D4AA78',
  '#D6AE71', '#D89965', '#D89D5F', '#D9AD8A', '#DFB796', '#E0AC69', '#E0B792', '#E1B571',
  '#EAC086', '#EBAB7F', '#ECC3A3', '#F1C27D', '#F7C19B', '#FBE5BA', '#FDDCB4', '#FDF1CB',
  '#FDF5E2', '#FFCD94', '#FFD6A4', '#FFDBAC', '#FFE0BD', '#FFE7D1'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting HEX data import...')

    // Prepare skin tone HEX references data
    const skinToneData = SKIN_HEX_VALUES.map(hex => {
      const lab = hexToLab(hex)
      return {
        hex_color: hex,
        lab_l: lab.l,
        lab_a: lab.a,
        lab_b: lab.b,
        undertone: classifyUndertone(lab.a, lab.b),
        depth_category: getDepthCategory(lab.l)
      }
    })

    // Insert skin tone HEX references
    const { error: skinToneError } = await supabase
      .from('skin_tone_hex_references')
      .upsert(skinToneData, { onConflict: 'hex_color' })

    if (skinToneError) {
      console.error('Error inserting skin tone data:', skinToneError)
      throw skinToneError
    }

    console.log(`Imported ${skinToneData.length} skin tone HEX references`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${skinToneData.length} skin tone HEX references`,
        imported: skinToneData.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})