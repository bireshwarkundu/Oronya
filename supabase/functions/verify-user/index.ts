import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is a government admin
    const { data: adminRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'government_admin')
      .single();

    if (roleError || !adminRole) {
      throw new Error('Insufficient permissions');
    }

    const { target_user_id, verification_status, verification_notes } = await req.json();

    // Input validation
    if (!target_user_id || typeof target_user_id !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    if (typeof verification_status !== 'boolean') {
      throw new Error('Invalid verification status');
    }
    
    if (!verification_notes || typeof verification_notes !== 'string') {
      throw new Error('Verification notes are required');
    }
    
    const trimmedNotes = verification_notes.trim();
    if (trimmedNotes.length === 0) {
      throw new Error('Verification notes cannot be empty');
    }
    
    if (trimmedNotes.length > 1000) {
      throw new Error('Verification notes too long (max 1000 characters)');
    }

    // Start a transaction to update profile and add history
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        is_verified: verification_status,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        verification_notes: trimmedNotes
      })
      .eq('user_id', target_user_id)
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Add to verification history
    const { error: historyError } = await supabaseClient
      .from('verification_history')
      .insert({
        user_id: target_user_id,
        verified_by: user.id,
        verification_status: verification_status,
        verification_notes: trimmedNotes
      });

    if (historyError) {
      console.error('Failed to add verification history:', historyError);
      // Don't throw here as the main verification was successful
    }

    console.log(`User ${target_user_id} ${verification_status ? 'verified' : 'rejected'} by admin ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${verification_status ? 'verified' : 'rejected'} successfully`,
        profile: profile
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Verification error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({
        error: 'Verification failed. Please try again.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})