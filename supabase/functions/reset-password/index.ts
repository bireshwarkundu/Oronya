import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, newPassword }: ResetPasswordRequest = await req.json();
    
    // Input validation
    if (!email || !otp || !newPassword) {
      throw new Error("Email, OTP, and new password are required");
    }
    
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Invalid email format");
    }
    
    if (email.length > 255) {
      throw new Error("Email too long");
    }
    
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      throw new Error("Invalid OTP format");
    }
    
    if (newPassword.length < 6 || newPassword.length > 100) {
      throw new Error("Password must be between 6 and 100 characters");
    }
    
    const safeEmail = email.trim().toLowerCase();
    const safeOtp = otp.trim();
    
    console.log("Processing password reset request");

    // Verify OTP and check if it's not expired or used
    const now = new Date().toISOString();
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_change_requests')
      .select('*')
      .eq('email', safeEmail)
      .eq('otp_code', safeOtp)
      .eq('verified', false)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      console.log("Invalid or expired OTP");
      throw new Error("Invalid or expired verification code");
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('password_change_requests')
      .update({ verified: true, used: true })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error("Failed to mark OTP as used:", updateError);
      throw new Error("Failed to verify OTP");
    }

    // Get user ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', safeEmail)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile not found");
      throw new Error("User not found");
    }

    // Update password using Admin API
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    );

    if (passwordError) {
      console.error("Password update failed:", passwordError);
      throw new Error("Failed to update password");
    }

    console.log("Password reset successful");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password reset successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error resetting password:", error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to reset password. Please try again.",
        success: false 
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
