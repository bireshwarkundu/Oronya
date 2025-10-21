import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, User, BarChart3, Settings, Lock, TreePine, Users, Award, Target } from "lucide-react";
import logo from "@/assets/logo.svg";
import ProfileModal from "@/components/ProfileModal";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CommunityLeaderPage = () => {
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
            <span className="ml-3 text-xl font-semibold">Community Leader Portal</span>
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
          <h1 className="text-4xl font-bold mb-2">Community Leader Dashboard</h1>
          <p className="text-muted-foreground">Lead your team's tree planting initiatives and track progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm text-muted-foreground">By your team</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Active participants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Credits Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0 tCO₂</p>
              <p className="text-sm text-muted-foreground">Total offset</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0%</p>
              <p className="text-sm text-muted-foreground">Of monthly target</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Upload Tree Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Document your team's tree planting activities with photos and GPS data.
              </p>
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Trees
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Manage your team information, set goals, and track individual contributions.
              </p>
              <Button className="w-full" variant="outline" onClick={() => setShowProfileModal(true)}>
                <Users className="mr-2 h-4 w-4" />
                Manage Team
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Leadership Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Community Leadership Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Set Up Your Team Profile</h3>
                  <p className="text-sm text-muted-foreground">Add team name, location, and contact details for your community group</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Recruit Team Members</h3>
                  <p className="text-sm text-muted-foreground">Invite community members to join your tree planting initiatives</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Coordinate Planting Events</h3>
                  <p className="text-sm text-muted-foreground">Organize community tree planting activities and ensure proper documentation</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track and Share Progress</h3>
                  <p className="text-sm text-muted-foreground">Monitor your team's impact and share success stories with the community</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Impact Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Team Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Your team's contribution to environmental restoration</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Trees This Week</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Trees This Month</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Area Covered (ha)</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Active Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userType="community_leader"
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

export default CommunityLeaderPage;
