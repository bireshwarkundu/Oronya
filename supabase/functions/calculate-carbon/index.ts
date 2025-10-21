import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Carbon density values (tons C/hectare) for different land cover classes
const CARBON_DENSITY: Record<string, number> = {
  'mangrove': 150,
  'seagrass': 50,
  'saltmarsh': 80,
  'tropical_forest': 120,
  'temperate_forest': 100,
  'mixed_forest': 90,
  'default': 75,
};

// CO2 conversion factor
const CO2_CONVERSION_FACTOR = 3.67;

// Average tree spacing and canopy area
const AVG_TREE_SPACING_SQM = 25; // Base: 5m x 5m spacing
const SQM_TO_HECTARE = 10000;

// Add variance to tree spacing (±1% to account for different densities)
function getTreeSpacing(): number {
  const variancePercent = (Math.random() * 0.02 - 0.01); // -1% to +1%
  return AVG_TREE_SPACING_SQM * (1 + variancePercent);
}

interface CalculationInput {
  tree_count?: number;
  land_cover_class?: string;
  area_hectares?: number;
  upload_id?: string;
}

interface CalculationResult {
  area_hectares: number;
  carbon_density: number;
  carbon_stock_tons: number;
  co2_equivalent_tons: number;
  land_cover_class: string;
}

function calculateCarbon(input: CalculationInput): CalculationResult {
  // Determine land cover class
  const landCoverClass = input.land_cover_class?.toLowerCase() || 'default';
  
  // Get carbon density for this class
  const carbonDensity = CARBON_DENSITY[landCoverClass] || CARBON_DENSITY['default'];
  
  // Calculate area in hectares
  let areaHectares: number;
  if (input.area_hectares) {
    // Add 1% variance to provided area to simulate measurement variations
    const areaVariance = (Math.random() * 0.02 - 0.01); // -1% to +1%
    areaHectares = input.area_hectares * (1 + areaVariance);
  } else if (input.tree_count) {
    // Estimate area from tree count with variable spacing
    const treeSpacing = getTreeSpacing();
    const areaSqm = input.tree_count * treeSpacing;
    areaHectares = areaSqm / SQM_TO_HECTARE;
  } else {
    throw new Error('Either tree_count or area_hectares must be provided');
  }
  
  // Add slight variance to carbon density (±1%) to account for soil and environmental differences
  const densityVariance = (Math.random() * 0.02 - 0.01); // -1% to +1%
  const adjustedCarbonDensity = carbonDensity * (1 + densityVariance);
  
  // Apply formula: Carbon Stock = Area × Carbon Density (with adjusted density)
  const carbonStockTons = areaHectares * adjustedCarbonDensity;
  
  // Convert to CO₂ equivalent: CO₂ = Carbon Stock × 3.67
  let co2EquivalentTons = carbonStockTons * CO2_CONVERSION_FACTOR;
  
  // Add final 0.5% variance to simulate measurement precision variations
  const finalVariance = (Math.random() * 0.01 - 0.005); // -0.5% to +0.5%
  co2EquivalentTons = co2EquivalentTons * (1 + finalVariance);
  
  return {
    area_hectares: parseFloat(areaHectares.toFixed(4)),
    carbon_density: parseFloat(adjustedCarbonDensity.toFixed(2)),
    carbon_stock_tons: parseFloat(carbonStockTons.toFixed(2)),
    co2_equivalent_tons: parseFloat(co2EquivalentTons.toFixed(2)),
    land_cover_class: landCoverClass,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { tree_count, land_cover_class, area_hectares, upload_id } = await req.json();

    console.log('Calculating carbon for:', { tree_count, land_cover_class, area_hectares, upload_id });

    // Calculate carbon
    const result = calculateCarbon({
      tree_count,
      land_cover_class,
      area_hectares,
      upload_id,
    });

    console.log('Calculation result:', result);

    // If upload_id provided, update the tree_uploads record
    if (upload_id) {
      const { error: updateError } = await supabaseClient
        .from('tree_uploads')
        .update({
          co2_offset: result.co2_equivalent_tons,
        })
        .eq('id', upload_id);

      if (updateError) {
        console.error('Error updating tree_uploads:', updateError);
        throw updateError;
      }

      console.log('Updated tree_uploads record:', upload_id);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in calculate-carbon function:', error);
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
