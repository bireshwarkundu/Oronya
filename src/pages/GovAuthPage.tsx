import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import logo from "@/assets/logo.svg";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

const govSignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  governmentId: z.string().trim().min(5, "Government ID must be at least 5 characters").max(50)
});

const govLoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

const GovAuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    governmentId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      if (mode === 'login') {
        const validatedData = govLoginSchema.parse(formData);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        // Check if user has government_admin role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'government_admin')
          .maybeSingle();

        if (!roleData) {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You don't have government employee access.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Login Successful",
          description: "Welcome to Government Verification Portal!",
        });
        
        navigate('/gov-verify');
      } else {
        const validatedData = govSignupSchema.parse(formData);

        const { data, error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/gov-verify`,
            data: {
              name: validatedData.name,
              government_id: validatedData.governmentId,
              user_type: 'government'
            }
          }
        });

        if (error) {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user) {
          // Add government_admin role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id.toString(),
              role: 'government_admin'
            });

          if (roleError) {
            console.error('Role assignment error:', roleError);
            toast({
              title: "Warning",
              description: "Account created but role assignment failed. Please contact support.",
              variant: "destructive",
            });
            return;
          }
        }

        toast({
          title: "Account Created!",
          description: "Your government employee account has been created. Please verify your email.",
        });

        setMode('login');
        setFormData({ name: '', email: '', password: '', governmentId: '' });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="Oronya" className="h-20 w-20" />
          </div>
          <CardTitle className="funnel-display-bold text-center text-2xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              Government Employee Portal
            </div>
            <p className="text-lg font-normal text-muted-foreground mt-2">
              {mode === 'login' ? 'Sign in to verify trees' : 'Create employee account'}
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="funnel-display-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="Enter your full name" 
                      value={formData.name} 
                      onChange={e => handleInputChange('name', e.target.value)} 
                      className="pl-10" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="governmentId" className="funnel-display-medium">Government Employee ID</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="governmentId" 
                      type="text" 
                      placeholder="Enter your employee ID" 
                      value={formData.governmentId} 
                      onChange={e => handleInputChange('governmentId', e.target.value)} 
                      className="pl-10" 
                      required 
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="funnel-display-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={formData.email} 
                  onChange={e => handleInputChange('email', e.target.value)} 
                  className="pl-10" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="funnel-display-medium">Password</Label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  value={formData.password} 
                  onChange={e => handleInputChange('password', e.target.value)} 
                  className="pl-10" 
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (mode === 'login' ? 'Signing In...' : 'Creating Account...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </Button>

            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setFormData({ name: '', email: '', password: '', governmentId: '' });
                }}
                className="text-primary hover:underline text-sm"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="text-center pt-2 border-t">
              <button 
                type="button" 
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-primary text-sm"
              >
                Back to main site
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </div>
  );
};

export default GovAuthPage;
