import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  name: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// HTML escape function to prevent XSS
const escapeHtml = (str: string): string => {
  return str.replace(/[&<>"']/g, (char) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[char] || char;
  });
};

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
    const { email, name }: SendOTPRequest = await req.json();
    
    // Input validation
    if (!email || !name) {
      throw new Error("Email and name are required");
    }
    
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Invalid email format");
    }
    
    if (email.length > 255) {
      throw new Error("Email too long");
    }
    
    if (name.length < 1 || name.length > 100) {
      throw new Error("Name must be between 1 and 100 characters");
    }
    
    // Sanitize inputs for use in email HTML
    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim().toLowerCase());
    
    console.log("Processing OTP request for email:", safeEmail);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        email: safeEmail,
        otp_code: otpCode,
        expires_at: expiresAt
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to process request");
    }

    // Send email with OTP
    console.log("Sending verification email");
    const emailResponse = await resend.emails.send({
      from: "Oronya <onboarding@resend.dev>",
      to: ["bireshwarofficial15@gmail.com"], // Admin email - only verified email that can receive
      subject: `New Account Signup - OTP for ${safeEmail}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Oronya</h1>
          </div>
          
          <h2 style="color: #333; text-align: center;">New Account Signup Request</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Hello Admin,
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Someone wants to create an account with Oronya. Here are the details:
          </p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${safeName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${safeEmail}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Please provide them with this verification code:
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">${otpCode}</span>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This verification code will expire in 10 minutes. Please share it with the user to complete their registration.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center;">
            This is an automated signup notification from Oronya.
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Email delivery failed");
      throw new Error("Failed to send verification email");
    }

    console.log("Verification email sent successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "OTP sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error processing request:", error.message);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request. Please try again.",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);