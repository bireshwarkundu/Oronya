import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/integrations/supabase/client";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'ngo' | 'company' | 'personal' | 'community_leader' | 'government'>('ngo');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      // Fetch user type from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profile?.user_type) {
        setUserType(profile.user_type as 'ngo' | 'company' | 'personal' | 'community_leader' | 'government');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <Dashboard 
      userType={userType} 
      onLogout={handleLogout} 
      onHome={handleHome}
    />
  );
};

export default DashboardPage;