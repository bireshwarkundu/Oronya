import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, ShoppingCart, Leaf, User, TrendingUp, CheckCircle, Clock, XCircle, DollarSign, TreePine, BarChart3, Settings, Lock, Home, Wallet, Shield } from "lucide-react";
import logo from "@/assets/logo.svg";
import ImageUploadModal from "./ImageUploadModal";
import ProfileModal from "./ProfileModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { connectWallet, requestAccountSwitch, registerFarmer, isFarmerRegistered, mintCarbonCredit, getSigner } from "@/lib/blockchain";

interface DashboardProps {
  userType: 'ngo' | 'company' | 'personal' | 'community_leader' | 'government';
  onLogout: () => void;
  onHome?: () => void;
}

const Dashboard = ({
  userType,
  onLogout,
  onHome
}: DashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isMinting, setIsMinting] = useState<string>(''); // Store upload ID being minted
  const { toast } = useToast();

  // Fetch uploads and user profile from database
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    initializeUser();
    fetchUploads();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUploads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tree_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error",
        description: "Failed to load uploads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleDisconnectWallet = () => {
    setWalletAddress('');
    toast({
      title: "Wallet Disconnected",
      description: "You can reconnect anytime to choose a different account",
    });
  };

  const handleSwitchAccount = async () => {
    setIsConnectingWallet(true);
    try {
      const address = await requestAccountSwitch();
      setWalletAddress(address);
      toast({
        title: "Account Changed",
        description: `Switched to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Account switch error:', error);
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch account",
        variant: "destructive"
      });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleMintNFT = async (upload: any) => {
    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first to mint NFT",
        variant: "destructive"
      });
      return;
    }

    setIsMinting(upload.id);
    try {
      // Get user email or profile name
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const registrantName = profileData?.display_name || user.email || 'Unknown';

      // Check if we need to upload to IPFS first
      let ipfsHash = '';
      const notesMatch = upload.verification_notes?.match(/IPFS: (\w+)/);
      
      if (notesMatch) {
        ipfsHash = notesMatch[1];
      } else {
        // Upload to IPFS if not done
        toast({
          title: "Uploading to IPFS",
          description: "Preparing NFT metadata...",
        });

        const { data: ipfsData, error: ipfsError } = await supabase.functions.invoke('upload-to-ipfs', {
          body: {
            image_url: upload.image_url,
            tree_count: upload.tree_count,
            co2_offset: upload.co2_offset,
            location: upload.location || 'Tree Upload',
            land_cover_class: 'forest',
            estimated_area_hectares: 0.1,
            registrant_name: registrantName,
            upload_id: upload.id
          }
        });

        if (ipfsError) throw ipfsError;
        ipfsHash = ipfsData.ipfs_hash;

        // Update database with IPFS hash
        await supabase
          .from('tree_uploads')
          .update({
            verification_notes: `${upload.verification_notes || ''} IPFS: ${ipfsHash}`
          })
          .eq('id', upload.id);
      }

      const ipfsUrl = `ipfs://${ipfsHash}`;

      // Register farmer if needed
      const signer = await getSigner();
      const address = await signer.getAddress();
      
      const isRegistered = await isFarmerRegistered(address);
      if (!isRegistered) {
        toast({
          title: "Registering Farmer",
          description: "First time registration. Please approve the transaction.",
        });
        
        await registerFarmer(
          registrantName,
          upload.location || 'Unknown Location'
        );
        
        toast({
          title: "Farmer Registered!",
          description: "You are now registered in the blockchain.",
        });
      }

      // Mint NFT
      toast({
        title: "Minting NFT",
        description: "Creating your carbon credit NFT. Please approve the transaction.",
      });

      const co2AmountInWei = Math.floor(upload.co2_offset * 100);
      const tx = await mintCarbonCredit(
        address,
        co2AmountInWei,
        ipfsUrl
      );

      // Update database with blockchain info
      await supabase
        .from('tree_uploads')
        .update({
          verification_notes: `Blockchain TX: ${tx.hash}, IPFS: ${ipfsHash}`
        })
        .eq('id', upload.id);

      toast({
        title: "NFT Minted Successfully!",
        description: `Transaction: ${tx.hash.substring(0, 10)}...`,
      });

      // Refresh uploads
      fetchUploads();
    } catch (error: any) {
      console.error('Minting error:', error);
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint NFT. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMinting('');
    }
  };

  // Calculate stats from real data
  const totalUploads = uploads.length;
  const verifiedUploads = uploads.filter(u => u.status === 'verified').length;
  const pendingUploads = uploads.filter(u => u.status === 'pending').length;
  const rejectedUploads = uploads.filter(u => u.status === 'rejected').length;
  
  // CO2 offset: Sum actual values from ML model calculations stored in database
  const carbonOffset = uploads
    .filter(u => u.status === 'verified')
    .reduce((sum, u) => sum + (parseFloat(u.co2_offset) || 0), 0)
    .toFixed(2);
  
  // Earnings: Will be calculated when marketplace is implemented
  const earnings = "0.00"; // Set to 0 until payment system is active

  // Company data - will be populated from blockchain transactions
  const companyData = {
    purchases: {
      total: 0,
      thisMonth: 0,
      totalSpent: 0
    },
    offsetProgress: 0,
    targetOffset: 500,
    currentOffset: 0,
    recentPurchases: []
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderNGODashboard = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="funnel-display-medium text-sm text-muted-foreground">Total Uploads</p>
                <p className="funnel-display-bold text-2xl text-primary">{totalUploads}</p>
              </div>
              <Upload className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="funnel-display-medium text-sm text-muted-foreground">Verified Trees</p>
                <p className="funnel-display-bold text-2xl text-success">{verifiedUploads}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="funnel-display-medium text-sm text-muted-foreground">Total Earnings</p>
                <p className="funnel-display-bold text-2xl text-primary">₹{earnings}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="funnel-display-medium text-sm text-muted-foreground">CO₂ Offset</p>
                <p className="funnel-display-bold text-2xl text-success">{carbonOffset}t</p>
              </div>
              <Leaf className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Message */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <h3 className="funnel-display-semibold text-lg mb-2">Your Environmental Impact</h3>
          <p className="funnel-display-normal opacity-90">
            You have uploaded {totalUploads} trees, with {verifiedUploads} verified, offsetting {carbonOffset} tonnes of CO₂. 
            Your contributions are helping create a sustainable future!
          </p>
        </CardContent>
      </Card>

      {/* All Uploads List */}
      <Card>
        <CardHeader>
          <CardTitle className="funnel-display-semibold">All Uploaded Trees</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading uploads...</p>
          ) : uploads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No uploads yet. Upload your first tree image to get started!</p>
          ) : (
            <div className="space-y-4">
              {uploads.map(upload => (
                <div key={upload.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      {upload.image_url ? (
                        <img src={upload.image_url} alt="Tree" className="w-full h-full object-cover" />
                      ) : (
                        <TreePine className="w-full h-full p-2 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="funnel-display-medium text-primary">{upload.location || 'Tree Upload'}</p>
                      <p className="funnel-display-normal text-sm text-muted-foreground">
                        {new Date(upload.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="funnel-display-medium text-sm text-primary">
                        {upload.co2_offset}t CO₂
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(upload.status)}
                      {upload.status === 'verified' && !upload.verification_notes?.includes('Blockchain TX') && (
                        <Button
                          size="sm"
                          onClick={() => handleMintNFT(upload)}
                          disabled={isMinting === upload.id || !walletAddress}
                          className="funnel-display-semibold"
                        >
                          {isMinting === upload.id ? 'Minting...' : 'Mint NFT'}
                        </Button>
                      )}
                      {upload.verification_notes?.includes('Blockchain TX') && (
                        <Badge variant="outline" className="bg-success/10 text-success">
                          NFT Minted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCompanyDashboard = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="funnel-display-medium text-sm text-muted-foreground">Total Credits</p>
                <p className="funnel-display-bold text-2xl text-primary">{companyData.purchases.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="funnel-display-medium text-sm text-muted-foreground">This Month</p>
                <p className="funnel-display-bold text-2xl text-success">{companyData.purchases.thisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="funnel-display-medium text-sm text-muted-foreground">Total Spent</p>
                <p className="funnel-display-bold text-2xl text-primary">${companyData.purchases.totalSpent}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="funnel-display-medium text-sm text-muted-foreground">Offset Progress</p>
                <p className="funnel-display-bold text-2xl text-success">{companyData.offsetProgress}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offset Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="funnel-display-semibold">Carbon Offset Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="funnel-display-medium text-muted-foreground">Current: {companyData.currentOffset}t CO₂</span>
              <span className="funnel-display-medium text-muted-foreground">Target: {companyData.targetOffset}t CO₂</span>
            </div>
            <Progress value={companyData.offsetProgress} className="h-3" />
            <p className="funnel-display-normal text-sm text-muted-foreground">
              You're {companyData.targetOffset - companyData.currentOffset}t CO₂ away from your annual target
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Impact Message */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <h3 className="funnel-display-semibold text-lg mb-2">Your Company's Impact</h3>
          <p className="funnel-display-normal opacity-90">
            Your company has purchased {companyData.purchases.total} credits, equal to planting {Math.round(companyData.purchases.total * 0.5)} trees. 
            Keep up the great work toward carbon neutrality!
          </p>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle className="funnel-display-semibold">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {companyData.recentPurchases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No purchases yet. Start offsetting your carbon footprint today!</p>
          ) : (
            <div className="space-y-4">
              {companyData.recentPurchases.map(purchase => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Leaf className="h-8 w-8 text-success" />
                    <div>
                      <p className="funnel-display-medium text-primary">{purchase.project}</p>
                      <p className="funnel-display-normal text-sm text-muted-foreground">{purchase.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="funnel-display-medium text-primary">{purchase.credits} credits</p>
                    <p className="funnel-display-normal text-sm text-muted-foreground">${purchase.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-0 rounded-none">
        <div className="container mx-auto flex items-center justify-between px-[23px] py-[2px] rounded-none">
          <div className="flex items-center cursor-pointer" onClick={onHome}>
            <img src={logo} alt="Oronya" className="h-12 w-12 hover:scale-105 transition-transform" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => setActiveTab('overview')} className={`funnel-display-medium transition-colors ${activeTab === 'overview' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Dashboard
            </button>
            <button onClick={onHome} className="funnel-display-medium transition-colors text-foreground hover:text-primary">
              Home Page
            </button>
          </nav>

          {/* Wallet Connection & User Dropdown Menu */}
          <div className="flex items-center gap-3">
            {/* Wallet Connection Button */}
            {walletAddress ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="funnel-display-medium">
                    <Wallet className="h-4 w-4 mr-2" />
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onClick={handleDisconnectWallet}
                  >
                    Disconnect Wallet
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onClick={handleSwitchAccount}
                    disabled={isConnectingWallet}
                  >
                    {isConnectingWallet ? 'Switching...' : 'Change Account'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleConnectWallet}
                disabled={isConnectingWallet}
                className="funnel-display-medium"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-10 h-10 rounded-full p-0 bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary transition-colors">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-lg z-50 transition-colors">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={onHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Home Page
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={() => setActiveTab('overview')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={() => setShowProfileModal(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-gray-100" onClick={onLogout}>
                  <User className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* CTA Section */}
        <div className="mb-8">
          {(userType === 'ngo' || userType === 'personal' || userType === 'community_leader') ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="funnel-display-bold text-3xl text-primary mb-2">
                  Welcome back, {userProfile?.display_name || 
                    (userType === 'ngo' ? 'NGO User' : 
                     userType === 'community_leader' ? 'Community Leader' : 
                     'User')}!
                </h1>
                <div className="flex items-center gap-3 mb-1">
                  {userProfile?.custom_user_id && (
                    <Badge variant="outline" className="funnel-display-medium text-sm px-3 py-1">
                      User ID: {userProfile.custom_user_id}
                    </Badge>
                  )}
                </div>
                <p className="funnel-display-normal text-muted-foreground">Upload new tree images to earn verified carbon credits</p>
              </div>
              <Button size="lg" className="funnel-display-semibold bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowUploadModal(true)}>
                <Upload className="h-5 w-5 mr-2" />
                Upload New Image
              </Button>
            </div>
          ) : userType === 'government' ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="funnel-display-bold text-3xl text-primary mb-2">
                  Welcome back, {userProfile?.display_name || 'Government Official'}!
                </h1>
                <div className="flex items-center gap-3 mb-1">
                  {userProfile?.custom_user_id && (
                    <Badge variant="outline" className="funnel-display-medium text-sm px-3 py-1">
                      User ID: {userProfile.custom_user_id}
                    </Badge>
                  )}
                </div>
                <p className="funnel-display-normal text-muted-foreground">Verify and manage tree planting initiatives</p>
              </div>
              <Button size="lg" className="funnel-display-semibold bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/gov-verify')}>
                <CheckCircle className="h-5 w-5 mr-2" />
                Verify Submissions
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="funnel-display-bold text-3xl text-primary mb-2">
                  Welcome back, {userProfile?.display_name || userProfile?.organization || 'Company'}!
                </h1>
                <div className="flex items-center gap-3 mb-1">
                  {userProfile?.custom_user_id && (
                    <Badge variant="outline" className="funnel-display-medium text-sm px-3 py-1">
                      User ID: {userProfile.custom_user_id}
                    </Badge>
                  )}
                </div>
                <p className="funnel-display-normal text-muted-foreground">Purchase verified carbon credits to offset your emissions</p>
              </div>
              <Button size="lg" className="funnel-display-semibold bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/store')}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Buy Carbon Credits
              </Button>
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        {(userType === 'ngo' || userType === 'personal' || userType === 'community_leader' || userType === 'government') ? renderNGODashboard() : renderCompanyDashboard()}
      </main>

      {/* Image Upload Modal */}
      <ImageUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={fetchUploads}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          fetchUserProfile(); // Refresh profile data after closing
        }}
        userType={userType}
        userId={currentUserId}
      />
    </div>
  );
};

export default Dashboard;
