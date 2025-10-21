import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import HomePage from "@/components/HomePage";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import NgoPage from "./NgoPage";
import CommunityLeaderPage from "./CommunityLeaderPage";
import PersonalPage from "./PersonalPage";

const Index = () => {
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'ngo' | 'company' | 'personal' | 'community_leader' | 'government'>('ngo');
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login'
  });
  const [loading, setLoading] = useState(true);

  // Set up Supabase auth listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile to get user type
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.user_type) {
        setUserType(data.user_type as 'ngo' | 'company' | 'personal' | 'community_leader' | 'government');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogin = () => {
    setAuthModal({ isOpen: true, mode: 'login' });
  };

  const handleSignup = () => {
    setAuthModal({ isOpen: true, mode: 'signup' });
  };

  const handleAuthSuccess = () => {
    setAuthModal({ isOpen: false, mode: 'login' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserType('ngo');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: 'login' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && session) {
    // Route to specific page based on user type
    if (userType === 'ngo') {
      return <NgoPage />;
    } else if (userType === 'community_leader') {
      return <CommunityLeaderPage />;
    } else if (userType === 'personal') {
      return <PersonalPage />;
    } else if (userType === 'government') {
      // Government users are redirected to the verification page
      navigate('/gov-verify');
      return null;
    } else {
      // Company users see the original HomePage
      return (
        <HomePage 
          userType={userType} 
          onLogout={handleLogout} 
          onDashboard={handleDashboard}
          onAdminPanel={handleAdminPanel}
          onHome={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }
  }

  return (
    <>
      <LandingPage onLoginClick={handleLogin} onSignupClick={handleSignup} />
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        mode={authModal.mode}
        onSuccess={handleAuthSuccess}
        onModeChange={(mode) => setAuthModal(prev => ({ ...prev, mode }))}
      />
    </>
  );
};

export default Index;
