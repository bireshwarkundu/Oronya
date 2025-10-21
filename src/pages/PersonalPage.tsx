import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, User, BarChart3, Settings, Lock, TreePine, Award, Calendar, Sparkles } from "lucide-react";
import logo from "@/assets/logo.svg";
import ProfileModal from "@/components/ProfileModal";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PersonalPage = () => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  // Get user ID and email
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
      }
    });
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="Oronya" className="h-12 w-12 hover:scale-105 transition-transform" />
            <span className="ml-3 text-xl font-semibold">My Carbon Journey</span>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowPasswordModal(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Your Personal Dashboard</h1>
          <p className="text-muted-foreground">Track your individual contribution to environmental restoration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5 text-primary" />
                Trees Planted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Your personal contribution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                CO₂ Offset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0 kg</p>
              <p className="text-sm text-muted-foreground">Carbon neutralized</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Active Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Days contributing</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Plant Your First Tree</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Start your environmental journey by uploading photos of trees you've planted.
              </p>
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Tree Photo
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Update your personal information and track your environmental impact.
              </p>
              <Button className="w-full" variant="outline" onClick={() => setShowProfileModal(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground">Add your location and contact information to get started</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Plant a Tree</h3>
                  <p className="text-sm text-muted-foreground">Get involved in local tree planting or plant in your own space</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload & Verify</h3>
                  <p className="text-sm text-muted-foreground">Take a photo with GPS data and submit for verification</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Your Impact</h3>
                  <p className="text-sm text-muted-foreground">Watch your environmental contribution grow over time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Your Environmental Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">See how your actions contribute to a greener future</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 border rounded-lg bg-primary/5">
                <TreePine className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-lg font-semibold">Trees Growing</p>
                <p className="text-sm text-muted-foreground mt-1">Every tree counts</p>
              </div>
              <div className="text-center p-6 border rounded-lg bg-primary/5">
                <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-lg font-semibold">Carbon Offset</p>
                <p className="text-sm text-muted-foreground mt-1">Making a difference</p>
              </div>
              <div className="text-center p-6 border rounded-lg bg-primary/5">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-lg font-semibold">Community Impact</p>
                <p className="text-sm text-muted-foreground mt-1">Together we grow</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userType="personal"
        userId={userId}
      />
      <PasswordChangeModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userId={userId}
        userEmail={userEmail}
      />
    </div>
  );
};

export default PersonalPage;
