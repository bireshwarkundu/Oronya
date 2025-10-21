import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, User, Home, BarChart3, Settings, Lock, TreePine, Users, Award, MapPin } from "lucide-react";
import logo from "@/assets/logo.svg";
import ProfileModal from "@/components/ProfileModal";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const NgoPage = () => {
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
            <span className="ml-3 text-xl font-semibold">NGO Dashboard</span>
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
          <h1 className="text-4xl font-bold mb-2">Welcome to Your NGO Portal</h1>
          <p className="text-muted-foreground">Manage your tree planting projects and carbon credit initiatives</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm text-muted-foreground">Start uploading tree images</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Carbon Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0 tCO₂</p>
              <p className="text-sm text-muted-foreground">Total carbon offset</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Projects in progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Upload Tree Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Upload photos of newly planted trees with GPS location data to start earning carbon credits.
              </p>
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Trees
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>NGO Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Update your NGO profile, add team members, and manage organization settings.
              </p>
              <Button className="w-full" variant="outline" onClick={() => setShowProfileModal(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground">Add your NGO details, location, and contact information</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Start a Tree Planting Project</h3>
                  <p className="text-sm text-muted-foreground">Plan your tree planting initiative and prepare for data collection</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload Tree Images</h3>
                  <p className="text-sm text-muted-foreground">Capture photos with GPS data and upload them for verification</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Earn Carbon Credits</h3>
                  <p className="text-sm text-muted-foreground">Once verified, receive carbon credits that can be sold on the marketplace</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userType="ngo"
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

export default NgoPage;
