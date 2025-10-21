import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import GovernmentAdminPanel from "@/components/AdminPanel";
import UserAdminPanel from "@/components/UserAdminPanel";
import CompanyAdminPanel from "@/components/CompanyAdminPanel";
import AuthModal from "@/components/AuthModal";
import CarbonValidation from "@/components/CarbonValidation";
import ModelValidation from "@/components/ModelValidation";
import ValidationTable from "@/components/ValidationTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPage = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await checkAdminStatus(session.user.id);
        } else {
          setShowAuthModal(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setShowAuthModal(true);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminStatus(session.user.id);
        setShowAuthModal(false);
      } else {
        setUser(null);
        setUserRole(null);
        setShowAuthModal(true);
      }
    });

    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['user_admin', 'company_admin', 'government_admin']);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Take the first admin role found
        setUserRole(data[0].role);
      } else {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access any admin panel.",
          variant: "destructive",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: "Authorization Error",
        description: "Failed to verify admin permissions.",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="funnel-display-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="funnel-display-bold text-2xl text-primary">Admin Panel</h1>
          <p className="funnel-display-normal text-muted-foreground">
            Please sign in with your admin account to continue.
          </p>
          
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => navigate('/')}
            onSuccess={handleAuthSuccess}
            mode={authMode}
            onModeChange={setAuthMode}
          />
        </div>
      </div>
    );
  }

  // Render the appropriate admin panel based on user role with validation tab
  if (userRole === 'user_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsList className="h-12 px-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="validation-table">Validation Table</TabsTrigger>
              <TabsTrigger value="validation">Carbon Validation</TabsTrigger>
              <TabsTrigger value="model">Model Validation</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="dashboard" className="mt-0">
            <UserAdminPanel onLogout={handleLogout} adminUserId={user.id} />
          </TabsContent>
          <TabsContent value="validation-table" className="p-6">
            <ValidationTable />
          </TabsContent>
          <TabsContent value="validation" className="p-6">
            <CarbonValidation />
          </TabsContent>
          <TabsContent value="model" className="p-6">
            <ModelValidation />
          </TabsContent>
        </Tabs>
      </div>
    );
  } else if (userRole === 'company_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsList className="h-12 px-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="validation-table">Validation Table</TabsTrigger>
              <TabsTrigger value="validation">Carbon Validation</TabsTrigger>
              <TabsTrigger value="model">Model Validation</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="dashboard" className="mt-0">
            <CompanyAdminPanel onLogout={handleLogout} adminUserId={user.id} />
          </TabsContent>
          <TabsContent value="validation-table" className="p-6">
            <ValidationTable />
          </TabsContent>
          <TabsContent value="validation" className="p-6">
            <CarbonValidation />
          </TabsContent>
          <TabsContent value="model" className="p-6">
            <ModelValidation />
          </TabsContent>
        </Tabs>
      </div>
    );
  } else if (userRole === 'government_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsList className="h-12 px-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="validation-table">Validation Table</TabsTrigger>
              <TabsTrigger value="validation">Carbon Validation</TabsTrigger>
              <TabsTrigger value="model">Model Validation</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="dashboard" className="mt-0">
            <GovernmentAdminPanel onLogout={handleLogout} adminUserId={user.id} />
          </TabsContent>
          <TabsContent value="validation-table" className="p-6">
            <ValidationTable />
          </TabsContent>
          <TabsContent value="validation" className="p-6">
            <CarbonValidation />
          </TabsContent>
          <TabsContent value="model" className="p-6">
            <ModelValidation />
          </TabsContent>
        </Tabs>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="funnel-display-bold text-2xl text-destructive">Invalid Admin Role</h1>
          <p className="funnel-display-normal text-muted-foreground">
            Your account has an unrecognized admin role. Please contact support.
          </p>
          <Button onClick={handleLogout}>Sign Out</Button>
        </div>
      </div>
    );
  }
};

export default AdminPage;