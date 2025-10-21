import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Leaf, ShoppingCart, ArrowLeft, Wallet, TrendingUp, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.svg";

interface CarbonCredit {
  id: string;
  user_id: string;
  location: string;
  co2_offset: number;
  image_url: string;
  created_at: string;
  ngo_name?: string;
}

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [availableCredits, setAvailableCredits] = useState<CarbonCredit[]>([]);
  const [selectedCredits, setSelectedCredits] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Price per credit token (in USD)
  const PRICE_PER_TOKEN_USD = 25;
  // Mock ETH price (should come from API like CoinGecko)
  const ETH_PRICE_USD = 2400;
  const PRICE_PER_TOKEN_ETH = (PRICE_PER_TOKEN_USD / ETH_PRICE_USD).toFixed(6);

  useEffect(() => {
    fetchAvailableCredits();
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask Not Installed",
        description: "Please install MetaMask browser extension from metamask.io to continue",
        variant: "destructive"
      });
      // Open MetaMask website
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        toast({
          title: "No Accounts Found",
          description: "Please create or unlock your MetaMask wallet",
          variant: "destructive"
        });
        return;
      }

      setWalletConnected(true);
      setWalletAddress(accounts[0]);
      toast({
        title: "Wallet Connected",
        description: `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      let errorMessage = "Failed to connect wallet. Please try again.";
      
      if (error.code === 4001) {
        errorMessage = "You rejected the connection request. Please try again and approve the connection.";
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending. Please check MetaMask.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const fetchAvailableCredits = async () => {
    try {
      // Fetch all verified tree uploads
      const { data: uploads, error } = await supabase
        .from('tree_uploads')
        .select('*')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for each upload
      const creditsWithProfiles = await Promise.all(
        (uploads || []).map(async (upload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', upload.user_id)
            .single();

          return {
            ...upload,
            ngo_name: profile?.display_name || 'Anonymous NGO'
          };
        })
      );

      setAvailableCredits(creditsWithProfiles);
    } catch (error) {
      console.error('Error fetching credits:', error);
      toast({
        title: "Error",
        description: "Failed to load available credits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (creditId: string, quantity: number) => {
    const newSelected = new Map(selectedCredits);
    if (quantity > 0) {
      newSelected.set(creditId, quantity);
    } else {
      newSelected.delete(creditId);
    }
    setSelectedCredits(newSelected);
  };

  const calculateTotals = () => {
    let totalCredits = 0;
    let totalCO2 = 0;

    selectedCredits.forEach((quantity, creditId) => {
      const credit = availableCredits.find(c => c.id === creditId);
      if (credit) {
        totalCredits += quantity;
        totalCO2 += credit.co2_offset * quantity;
      }
    });

    const totalUSD = totalCredits * PRICE_PER_TOKEN_USD;
    const totalETH = (totalCredits * parseFloat(PRICE_PER_TOKEN_ETH)).toFixed(6);

    return { totalCredits, totalCO2, totalUSD, totalETH };
  };

  const handlePurchase = async () => {
    if (!walletConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to purchase credits",
        variant: "destructive"
      });
      return;
    }

    if (selectedCredits.size === 0) {
      toast({
        title: "No Credits Selected",
        description: "Please select at least one credit to purchase",
        variant: "destructive"
      });
      return;
    }

    const totals = calculateTotals();

    // TODO: Call smart contract to execute purchase
    // This is where you'll integrate your blockchain smart contract
    toast({
      title: "Smart Contract Integration Required",
      description: `Ready to purchase ${totals.totalCredits} credits for ${totals.totalETH} ETH. Please provide your smart contract address and ABI.`,
    });

    // After successful blockchain transaction:
    // 1. Record purchase in database
    // 2. Update token ownership
    // 3. Transfer funds to NGO wallets
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <img src={logo} alt="Oronya" className="h-10 w-10" />
            <h1 className="funnel-display-semibold text-xl">Carbon Credit Marketplace</h1>
          </div>
          
          {walletConnected ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <Wallet className="h-3 w-3 mr-1" />
              {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
            </Badge>
          ) : (
            <Button onClick={connectWallet} variant="outline">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <Card className="bg-primary/5 border-primary/20 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Leaf className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="funnel-display-semibold text-lg mb-2">Purchase Verified Carbon Credits</h2>
                <p className="funnel-display-normal text-sm text-muted-foreground">
                  Each credit represents verified CO₂ offset from real tree plantations. Purchases are secured on the blockchain, 
                  and payments go directly to NGOs managing these reforestation projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Available Credits */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="funnel-display-semibold">Available Carbon Credits</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading available credits...</p>
                ) : availableCredits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No credits available at the moment</p>
                ) : (
                  <div className="space-y-4">
                    {availableCredits.map(credit => (
                      <div key={credit.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                            <img src={credit.image_url} alt="Tree" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="funnel-display-medium text-primary">{credit.ngo_name}</p>
                            <p className="funnel-display-normal text-sm text-muted-foreground flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {credit.location}
                            </p>
                            <p className="funnel-display-normal text-sm text-success mt-1">
                              {credit.co2_offset}t CO₂ per credit
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="funnel-display-medium text-primary">${PRICE_PER_TOKEN_USD}</p>
                            <p className="funnel-display-normal text-xs text-muted-foreground">{PRICE_PER_TOKEN_ETH} ETH</p>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            className="w-20"
                            value={selectedCredits.get(credit.id) || ''}
                            onChange={(e) => handleQuantityChange(credit.id, parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Purchase Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="funnel-display-semibold">Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="funnel-display-normal text-sm text-muted-foreground">Total Credits</span>
                    <span className="funnel-display-medium">{totals.totalCredits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="funnel-display-normal text-sm text-muted-foreground">Total CO₂ Offset</span>
                    <span className="funnel-display-medium text-success">{totals.totalCO2.toFixed(2)}t</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between mb-2">
                      <span className="funnel-display-medium">Total (USD)</span>
                      <span className="funnel-display-semibold text-lg">${totals.totalUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="funnel-display-normal text-sm text-muted-foreground">Total (ETH)</span>
                      <span className="funnel-display-medium text-primary">{totals.totalETH} ETH</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full funnel-display-semibold"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={!walletConnected || selectedCredits.size === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Purchase with ETH
                </Button>

                {!walletConnected && (
                  <p className="text-xs text-center text-muted-foreground">
                    Connect your wallet to purchase credits
                  </p>
                )}

                {/* Price Reference */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    Current ETH Price: ${ETH_PRICE_USD}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketplacePage;
