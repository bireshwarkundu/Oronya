import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  tree_count: number;
  land_cover_class: string;
  estimated_area_hectares: number;
  confidence: string;
  analysis_notes: string;
}

// Simple hash function for image URLs
async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json();
    
    if (!image_url) {
      throw new Error('image_url is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate hash of image URL
    const imageHash = await hashString(image_url);
    console.log('Image hash:', imageHash);

    // Check cache first
    const { data: cachedResult, error: cacheError } = await supabase
      .from('tree_image_analysis_cache')
      .select('*')
      .eq('image_hash', imageHash)
      .single();

    if (cachedResult && !cacheError) {
      console.log('Cache hit! Returning cached result');
      
      // Update last_accessed_at
      await supabase
        .from('tree_image_analysis_cache')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('image_hash', imageHash);

      const result: AnalysisResult = {
        tree_count: cachedResult.tree_count,
        land_cover_class: cachedResult.land_cover_class,
        estimated_area_hectares: cachedResult.estimated_area_hectares,
        confidence: cachedResult.confidence,
        analysis_notes: cachedResult.analysis_notes + ' (from cache)'
      };

      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('Cache miss. Analyzing tree image:', image_url);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI with image analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert forestry analyst. Analyze tree images and provide estimates for carbon credit calculation.

CRITICAL: If the image does NOT contain any trees, forests, or vegetation suitable for carbon credits, you MUST return tree_count as 0.

Examples of images to REJECT (return tree_count: 0):
- People, animals, buildings
- Indoor scenes
- Urban environments without trees
- Non-vegetation images

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "tree_count": <number of visible trees, or 0 if NO trees present>,
  "land_cover_class": "<one of: mangrove, seagrass, saltmarsh, tropical_forest, temperate_forest, mixed_forest>",
  "estimated_area_hectares": <estimated area in hectares based on tree density>,
  "confidence": "<low/medium/high>",
  "analysis_notes": "<brief description of what you see>"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this tree image and provide carbon estimation parameters.'
              },
              {
                type: 'image_url',
                image_url: { url: image_url }
              }
            ]
          }
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    console.log('Raw AI response:', aiContent);

    // Parse AI response - handle both raw JSON and markdown-wrapped JSON
    let analysis: AnalysisResult;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = aiContent.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback to defaults if parsing fails
      analysis = {
        tree_count: 10,
        land_cover_class: 'mixed_forest',
        estimated_area_hectares: 0.025,
        confidence: 'low',
        analysis_notes: 'AI analysis parsing failed, using defaults'
      };
    }

    // Validate and sanitize the response
    const result: AnalysisResult = {
      tree_count: Math.max(0, Math.floor(Number(analysis.tree_count) || 0)),
      land_cover_class: ['mangrove', 'seagrass', 'saltmarsh', 'tropical_forest', 'temperate_forest', 'mixed_forest']
        .includes(analysis.land_cover_class) ? analysis.land_cover_class : 'mixed_forest',
      estimated_area_hectares: Math.max(0, Number(analysis.estimated_area_hectares) || 0),
      confidence: analysis.confidence || 'medium',
      analysis_notes: analysis.analysis_notes || 'Analysis completed'
    };

    console.log('Parsed analysis result:', result);

    // Store result in cache
    try {
      await supabase
        .from('tree_image_analysis_cache')
        .insert({
          image_hash: imageHash,
          tree_count: result.tree_count,
          land_cover_class: result.land_cover_class,
          estimated_area_hectares: result.estimated_area_hectares,
          confidence: result.confidence,
          analysis_notes: result.analysis_notes
        });
      console.log('Result cached successfully');
    } catch (cacheInsertError) {
      console.error('Failed to cache result:', cacheInsertError);
      // Don't fail the request if caching fails
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in analyze-tree-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
