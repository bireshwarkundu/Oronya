import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Mail, Shield, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emailSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255)
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers")
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(100),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse({ email });
      setIsLoading(true);

      // Send OTP directly - don't reveal if email exists (security best practice)
      const { error } = await supabase.functions.invoke('password-change-otp', {
        body: {
          email: email,
          user_id: '' // Edge function will find user_id from email
        }
      });

      if (error) {
        console.error("OTP request error:", error);
        toast({
          title: "Error",
          description: "Failed to send verification code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Always show success message (don't reveal if email exists)
      toast({
        title: "Verification Code Sent",
        description: "If an account exists with this email, you will receive a 6-digit code.",
      });

      setStep('otp');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Email submit error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      otpSchema.parse({ otp });
      setIsLoading(true);

      // Verify OTP
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('password_change_requests')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .eq('verified', false)
        .eq('used', false)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("OTP verification error:", error);
        toast({
          title: "Verification Failed",
          description: "An error occurred while verifying your code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Invalid Code",
          description: "The code you entered is invalid or has expired. Please request a new one.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Code Verified",
        description: "Please enter your new password.",
      });

      setStep('password');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("OTP submit error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse({ newPassword, confirmPassword });
      setIsLoading(true);

      // Call reset-password edge function
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          email: email,
          otp: otp,
          newPassword: newPassword
        }
      });

      if (error || !data?.success) {
        console.error("Password reset error:", error);
        toast({
          title: "Password Reset Failed",
          description: data?.error || "Failed to reset your password. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now login with your new password.",
      });

      // Reset form and close
      handleClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Password submit error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setUserId('');
    setStep('email');
    onClose();
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('password-change-otp', {
        body: {
          email: email,
          user_id: '' // Edge function will find user_id from email
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to resend code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Code Resent",
        description: "If an account exists, a new code has been sent.",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'email' && "Enter your email to receive a verification code"}
            {step === 'otp' && "Enter the 6-digit code sent to your email"}
            {step === 'password' && "Enter your new password"}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Sending..." : "Send Code"}
              </Button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="text-center text-sm text-muted-foreground mb-4">
              We've sent a 6-digit code to:
              <div className="font-medium text-foreground mt-1">{email}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-10 text-center text-lg tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-sm text-primary hover:underline"
              >
                Didn't receive the code? Resend
              </button>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('email')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex-1"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
