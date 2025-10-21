import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetadataInput {
  image_url: string;
  tree_count: number;
  co2_offset: number;
  location: string;
  land_cover_class: string;
  estimated_area_hectares: number;
  registrant_name: string;
  upload_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metadata: MetadataInput = await req.json();
    
    console.log('Uploading metadata to IPFS:', metadata);

    const PINATA_API_KEY = Deno.env.get('PINATA_API_KEY');
    if (!PINATA_API_KEY) {
      throw new Error('PINATA_API_KEY not configured');
    }

    // Create metadata object for NFT
    const nftMetadata = {
      name: `Carbon Credit - ${metadata.registrant_name}`,
      description: `Carbon credit NFT representing ${metadata.co2_offset} tons of CO2 offset from ${metadata.tree_count} trees`,
      image: metadata.image_url,
      attributes: [
        { trait_type: "Tree Count", value: metadata.tree_count },
        { trait_type: "CO2 Offset (tons)", value: metadata.co2_offset },
        { trait_type: "Location", value: metadata.location },
        { trait_type: "Land Cover Class", value: metadata.land_cover_class },
        { trait_type: "Area (hectares)", value: metadata.estimated_area_hectares },
        { trait_type: "Registrant", value: metadata.registrant_name },
        { trait_type: "Upload ID", value: metadata.upload_id },
        { trait_type: "Timestamp", value: new Date().toISOString() }
      ]
    };

    console.log('NFT Metadata:', nftMetadata);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: nftMetadata,
        pinataMetadata: {
          name: `carbon-credit-${metadata.upload_id}.json`
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata error:', response.status, errorText);
      throw new Error(`IPFS upload failed: ${errorText}`);
    }

    const result = await response.json();
    const ipfsHash = result.IpfsHash;
    const ipfsUrl = `ipfs://${ipfsHash}`;

    console.log('Successfully uploaded to IPFS:', ipfsUrl);

    return new Response(
      JSON.stringify({ 
        ipfs_hash: ipfsHash,
        ipfs_url: ipfsUrl,
        gateway_url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in upload-to-ipfs function:', error);
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
