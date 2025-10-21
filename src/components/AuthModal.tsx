import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Lock, User, Building, Shield, MapPin, Phone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import logo from "@/assets/logo.svg";
import ForgotPasswordModal from "./ForgotPasswordModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onSuccess: () => void;
  onModeChange: (mode: 'login' | 'signup') => void;
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
  organization: z.string().trim().max(200, "Organization name must be less than 200 characters").optional(),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
  phone_number: z.string().trim().max(20, "Phone number must be less than 20 characters").optional(),
  team_name: z.string().trim().max(200, "Team name must be less than 200 characters").optional()
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

const AuthModal = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
  onModeChange
}: AuthModalProps) => {
  const [userType, setUserType] = useState<'personal' | 'ngo' | 'community_leader' | 'company'>('personal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    location: '',
    phone_number: '',
    team_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      if (mode === 'login') {
        const validatedData = loginSchema.parse(formData);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        if (error) {
          const errorMessage = error.message.toLowerCase().includes('invalid') 
            ? "Invalid email or password. Please check your credentials and try again."
            : error.message;
          
          toast({
            title: "Login Failed",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Login Successful",
          description: "Welcome back to Oronya!",
        });
        
        resetForm();
        onSuccess();
        onClose();
      } else {
        // Signup flow
        const validatedData = signupSchema.parse(formData);

        const { data, error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: validatedData.name,
              user_type: userType,
              organization: validatedData.organization || null,
              location: validatedData.location || null,
              phone_number: validatedData.phone_number || null,
              team_name: validatedData.team_name || null
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

        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });

        resetForm();
        onSuccess();
        onClose();
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      organization: '',
      location: '',
      phone_number: '',
      team_name: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="Oronya" className="h-24 w-24" />
          </div>
          <DialogTitle className="funnel-display-semibold text-center text-2xl">
            {mode === 'login' ? 'Welcome Back' : 'Join Oronya'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <>
              {/* User Type Selection */}
              <div className="space-y-3">
                <Label className="funnel-display-medium text-base">I am a:</Label>
                <RadioGroup value={userType} onValueChange={(value: 'personal' | 'ngo' | 'community_leader' | 'company') => setUserType(value)}>
                  <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal" className="flex items-center cursor-pointer flex-1">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="funnel-display-medium">Personal</div>
                        <div className="funnel-display-normal text-sm text-muted-foreground">Individual contributor</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="ngo" id="ngo" />
                    <Label htmlFor="ngo" className="flex items-center cursor-pointer flex-1">
                      <Building className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="funnel-display-medium">NGO</div>
                        <div className="funnel-display-normal text-sm text-muted-foreground">Non-profit organization</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="community_leader" id="community_leader" />
                    <Label htmlFor="community_leader" className="flex items-center cursor-pointer flex-1">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="funnel-display-medium">Community Leader</div>
                        <div className="funnel-display-normal text-sm text-muted-foreground">Lead tree planting initiatives</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="company" id="company" />
                    <Label htmlFor="company" className="flex items-center cursor-pointer flex-1">
                      <Building className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <div className="funnel-display-medium">Company</div>
                        <div className="funnel-display-normal text-sm text-muted-foreground">Purchase carbon credits</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="funnel-display-medium">
                  {userType === 'community_leader' ? 'Community Leader Name' : 'Full Name'}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Enter your name" 
                    value={formData.name} 
                    onChange={e => handleInputChange('name', e.target.value)} 
                    className="pl-10 funnel-display-normal" 
                    required 
                  />
                </div>
              </div>

              {/* NGO Name Field */}
              {userType === 'ngo' && (
                <div className="space-y-2">
                  <Label htmlFor="organization" className="funnel-display-medium">NGO Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="organization" 
                      type="text" 
                      placeholder="Enter NGO name" 
                      value={formData.organization} 
                      onChange={e => handleInputChange('organization', e.target.value)} 
                      className="pl-10 funnel-display-normal" 
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Company Name Field */}
              {userType === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="organization" className="funnel-display-medium">Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="organization" 
                      type="text" 
                      placeholder="Enter company name" 
                      value={formData.organization} 
                      onChange={e => handleInputChange('organization', e.target.value)} 
                      className="pl-10 funnel-display-normal" 
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Team Name Field - Community Leader */}
              {userType === 'community_leader' && (
                <div className="space-y-2">
                  <Label htmlFor="team_name" className="funnel-display-medium">Team Name</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="team_name" 
                      type="text" 
                      placeholder="Enter team name" 
                      value={formData.team_name} 
                      onChange={e => handleInputChange('team_name', e.target.value)} 
                      className="pl-10 funnel-display-normal" 
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Location Field - All except company */}
              {userType !== 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="location" className="funnel-display-medium">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="location" 
                      type="text" 
                      placeholder="Enter your location" 
                      value={formData.location} 
                      onChange={e => handleInputChange('location', e.target.value)} 
                      className="pl-10 funnel-display-normal" 
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Phone Number Field - All types */}
              {userType !== 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="funnel-display-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone_number" 
                      type="tel" 
                      placeholder="Enter your phone number" 
                      value={formData.phone_number} 
                      onChange={e => handleInputChange('phone_number', e.target.value)} 
                      className="pl-10 funnel-display-normal" 
                      required 
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email Field */}
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
                className="pl-10 funnel-display-normal" 
                required 
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="funnel-display-medium">Password</Label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setShowForgotPassword(true);
                  }}
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
                className="pl-10 funnel-display-normal" 
                required 
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full funnel-display-semibold bg-primary text-primary-foreground hover:bg-primary/90" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (mode === 'login' ? 'Signing In...' : 'Creating Account...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>

          {/* Government Employee Registration */}
          {mode === 'signup' && (
            <div className="text-center border-t pt-4">
              <p className="funnel-display-normal text-muted-foreground mb-2">
                Are you a government employee?
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => window.location.href = '/gov-auth'}
                className="w-full gap-2"
              >
                <Shield className="h-4 w-4" />
                Register as Government Employee
              </Button>
            </div>
          )}

          {/* Switch Mode */}
          <div className="text-center">
            <p className="funnel-display-normal text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button" 
                onClick={() => {
                  resetForm();
                  onModeChange(mode === 'login' ? 'signup' : 'login');
                }} 
                className="funnel-display-medium text-primary hover:underline ml-1"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>
      </DialogContent>

      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </Dialog>
  );
};

export default AuthModal;
