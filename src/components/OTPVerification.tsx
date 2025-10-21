import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface OTPVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: () => void;
}

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers")
});

const OTPVerification = ({ isOpen, onClose, email, onSuccess }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = otpSchema.parse({ otp });
      setIsVerifying(true);

      // Get current time
      const now = new Date().toISOString();

      // Verify OTP from database
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp_code', validatedData.otp)
        .eq('verified', false)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Database error:", error);
        toast({
          title: "Verification Failed",
          description: "An error occurred while verifying your OTP. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Invalid OTP",
          description: "The OTP you entered is invalid or has expired. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Mark OTP as verified
      const { error: updateError } = await supabase
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', data.id);

      if (updateError) {
        console.error("Update error:", updateError);
        toast({
          title: "Verification Failed",
          description: "Failed to complete verification. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Verification Successful",
        description: "Your account has been verified successfully!",
      });

      onSuccess();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid OTP",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Verification error:", error);
        toast({
          title: "Verification Failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);

      const { error } = await supabase.functions.invoke('send-otp', {
        body: { 
          email,
          name: email.split('@')[0] // Use email prefix as name for resend
        }
      });

      if (error) {
        console.error("Resend error:", error);
        toast({
          title: "Resend Failed",
          description: "Failed to resend OTP. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
      
      setOtp(""); // Clear current OTP input
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Resend Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Verify Your Email</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            We've sent a 6-digit verification code to:
            <div className="font-medium text-foreground mt-1">{email}</div>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Didn't receive the code?</span>
            <Button
              variant="link"
              onClick={handleResendOTP}
              disabled={isResending}
              className="p-0 h-auto"
            >
              {isResending ? "Resending..." : "Resend"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerification;