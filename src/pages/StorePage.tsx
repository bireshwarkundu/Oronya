import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShoppingCart, Plus, Minus, Wallet, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { connectWallet as connectBlockchainWallet, requestAccountSwitch, getFarmerInfo, registerFarmer, mintCarbonCredit, getUserCarbonCredits } from "@/lib/blockchain";
import logo from "@/assets/logo.svg";
import token1 from "@/assets/token-1.svg";
import token2 from "@/assets/token-2.svg";
import token3 from "@/assets/token-3.svg";
import token4 from "@/assets/token-4.svg";
import token5 from "@/assets/token-5.svg";
import token6 from "@/assets/token-6.svg";
import token7 from "@/assets/token-7.svg";
import token8 from "@/assets/token-8.svg";

interface Token {
  id: number;
  name: string;
  image: string;
  priceUSD: number;
}

interface CartItem extends Token {
  quantity: number;
}

const TOKENS: Token[] = [
  { id: 1, name: "Golden Ape #001", image: token1, priceUSD: 25 },
  { id: 2, name: "Coral Ape #002", image: token2, priceUSD: 25 },
  { id: 3, name: "Rose Ape #003", image: token3, priceUSD: 25 },
  { id: 4, name: "Purple Ape #004", image: token4, priceUSD: 25 },
  { id: 5, name: "Red Ape #005", image: token5, priceUSD: 25 },
  { id: 6, name: "Blue Ape #006", image: token6, priceUSD: 25 },
  { id: 7, name: "Green Ape #007", image: token7, priceUSD: 25 },
  { id: 8, name: "Pastel Ape #008", image: token8, priceUSD: 25 },
];

const ETH_PRICE_USD = 2400;

const StorePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [userType, setUserType] = useState<'ngo' | 'company' | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    checkUserType();
  }, []);

  const checkUserType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile?.user_type) {
          setUserType(profile.user_type as 'ngo' | 'company');
        }
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
    }
  };

  const connectWallet = async () => {
    try {
      const address = await connectBlockchainWallet();
      setWalletConnected(true);
      setWalletAddress(address);
      addTestResult(`✅ Wallet connected: ${address.substring(0, 6)}...${address.substring(38)}`);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      addTestResult(`❌ Wallet connection failed: ${error.message}`);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    addTestResult('🔌 Wallet disconnected');
    toast({
      title: "Wallet Disconnected",
      description: "You can reconnect anytime to choose a different account",
    });
  };

  const switchAccount = async () => {
    try {
      const address = await requestAccountSwitch();
      setWalletConnected(true);
      setWalletAddress(address);
      addTestResult(`🔄 Account switched: ${address.substring(0, 6)}...${address.substring(38)}`);
      toast({
        title: "Account Changed",
        description: `Switched to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Error switching account:', error);
      addTestResult(`❌ Account switch failed: ${error.message}`);
      toast({
        title: "Switch Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [`[${new Date().toLocaleTimeString()}] ${result}`, ...prev.slice(0, 9)]);
  };

  const testFarmerRegistration = async () => {
    if (!walletConnected) {
      toast({ title: "Connect wallet first", variant: "destructive" });
      return;
    }
    try {
      addTestResult("⏳ Registering farmer...");
      const tx = await registerFarmer("Test Farmer", "Test Location");
      addTestResult(`✅ Farmer registered! TX: ${tx.hash}`);
      toast({ title: "Success", description: "Farmer registered on blockchain" });
    } catch (error: any) {
      addTestResult(`❌ Registration failed: ${error.message}`);
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  const testGetFarmerInfo = async () => {
    if (!walletAddress) {
      toast({ title: "Connect wallet first", variant: "destructive" });
      return;
    }
    try {
      addTestResult("⏳ Getting farmer info...");
      const info = await getFarmerInfo(walletAddress);
      addTestResult(`✅ Farmer: ${info.name}, Verified: ${info.isVerified}`);
    } catch (error: any) {
      addTestResult(`❌ Get info failed: ${error.message}`);
    }
  };

  const testMintCredit = async () => {
    if (!walletAddress) {
      toast({ title: "Connect wallet first", variant: "destructive" });
      return;
    }
    try {
      addTestResult("⏳ Minting carbon credit NFT...");
      const tx = await mintCarbonCredit(walletAddress, 100, "ipfs://test-metadata");
      addTestResult(`✅ NFT minted! TX: ${tx.hash}`);
      toast({ title: "Success", description: "Carbon credit NFT minted!" });
    } catch (error: any) {
      addTestResult(`❌ Mint failed: ${error.message}`);
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  const testGetUserCredits = async () => {
    if (!walletAddress) {
      toast({ title: "Connect wallet first", variant: "destructive" });
      return;
    }
    try {
      addTestResult("⏳ Getting user's carbon credits...");
      const credits = await getUserCarbonCredits(walletAddress);
      addTestResult(`✅ Found ${credits.length} carbon credits`);
      credits.forEach((credit, i) => {
        addTestResult(`  NFT #${credit.tokenId}: ${credit.co2Amount} kg CO2`);
      });
    } catch (error: any) {
      addTestResult(`❌ Get credits failed: ${error.message}`);
    }
  };

  const addToCart = (token: Token) => {
    // Check if user is a company and already has a token in cart
    if (userType === 'company' && cart.length > 0) {
      toast({
        title: "Purchase Limit Reached",
        description: "Companies can only purchase one NFT token at a time",
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === token.id);
      if (existing) {
        // Companies cannot increase quantity
        if (userType === 'company') {
          toast({
            title: "Purchase Limit",
            description: "Companies can only purchase one token at a time",
            variant: "destructive",
          });
          return prev;
        }
        return prev.map(item =>
          item.id === token.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...token, quantity: 1 }];
    });

    toast({
      title: "Added to Cart",
      description: `${token.name} added to cart`,
    });
  };

  const updateQuantity = (tokenId: number, change: number) => {
    // Companies cannot increase quantity beyond 1
    if (userType === 'company' && change > 0) {
      toast({
        title: "Purchase Limit",
        description: "Companies can only purchase one token at a time",
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      return prev.map(item => {
        if (item.id === tokenId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (tokenId: number) => {
    setCart(prev => prev.filter(item => item.id !== tokenId));
    toast({
      title: "Removed from Cart",
      description: "Item removed from cart",
    });
  };

  const calculateTotals = () => {
    const totalUSD = cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
    const totalETH = (totalUSD / ETH_PRICE_USD).toFixed(6);
    const totalTokens = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { totalUSD, totalETH, totalTokens };
  };

  const handleCheckout = async () => {
    if (!walletConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to purchase",
        variant: "destructive"
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to cart",
        variant: "destructive"
      });
      return;
    }

    const totals = calculateTotals();

    // TODO: Integrate with smart contract
    toast({
      title: "Smart Contract Integration Required",
      description: `Ready to purchase ${totals.totalTokens} tokens for ${totals.totalETH} ETH`,
    });
  };

  const totals = calculateTotals();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <img src={logo} alt="Oronya" className="h-10 w-10" />
            <h1 className="funnel-display-semibold text-xl">Carbon Credit Token Store</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setShowTestPanel(!showTestPanel)} 
              variant={showTestPanel ? "default" : "outline"}
              size="sm"
            >
              {showTestPanel ? "Hide" : "Show"} Test Panel
            </Button>
            
            {walletConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="funnel-display-medium">
                    <Wallet className="h-4 w-4 mr-2" />
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onClick={disconnectWallet}
                  >
                    Disconnect Wallet
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-100" 
                    onClick={switchAccount}
                  >
                    Change Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={connectWallet} variant="outline" size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCart(!showCart)}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Test Panel */}
        {showTestPanel && (
          <Card className="mb-8 border-2 border-primary">
            <CardContent className="p-6">
              <h3 className="funnel-display-bold text-xl mb-4">🧪 Blockchain Test Panel</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="funnel-display-semibold">Contract Functions</h4>
                  <Button onClick={testFarmerRegistration} size="sm" className="w-full">
                    Register Farmer
                  </Button>
                  <Button onClick={testGetFarmerInfo} size="sm" variant="outline" className="w-full">
                    Get Farmer Info
                  </Button>
                  <Button onClick={testMintCredit} size="sm" className="w-full">
                    Mint Carbon Credit NFT
                  </Button>
                  <Button onClick={testGetUserCredits} size="sm" variant="outline" className="w-full">
                    Get My NFTs
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="funnel-display-semibold">Test Results</h4>
                  <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
                    {testResults.length === 0 ? (
                      <p className="text-muted-foreground">No tests run yet. Click buttons to test.</p>
                    ) : (
                      testResults.map((result, i) => (
                        <div key={i} className="mb-1">{result}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!showCart ? (
          <>
            {/* Store Header */}
            <div className="text-center mb-12">
              <h2 className="funnel-display-bold text-4xl mb-4">Verified Carbon Credit Tokens</h2>
              <p className="funnel-display-normal text-lg text-muted-foreground max-w-2xl mx-auto">
                Each token represents verified CO₂ offset from real tree plantations. Secured on blockchain with transparent tracking.
              </p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <Badge variant="outline" className="text-sm">
                  1 ETH = ${ETH_PRICE_USD}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  8 Unique Tokens
                </Badge>
              </div>
            </div>

            {/* Token Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TOKENS.map(token => {
                const priceETH = (token.priceUSD / ETH_PRICE_USD).toFixed(6);
                const inCart = cart.find(item => item.id === token.id);

                return (
                  <Card key={token.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                        <img
                          src={token.image}
                          alt={token.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="funnel-display-semibold text-lg">{token.name}</h3>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Price (USD)</span>
                            <span className="funnel-display-semibold text-primary">${token.priceUSD}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Price (ETH)</span>
                            <span className="funnel-display-medium text-sm">{priceETH} ETH</span>
                          </div>
                        </div>

                        {inCart && (
                          <Badge variant="secondary" className="w-full justify-center">
                            {inCart.quantity} in cart
                          </Badge>
                        )}

                        {inCart ? (
                          <Button
                            variant="destructive"
                            className="w-full funnel-display-semibold"
                            onClick={() => removeFromCart(token.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Cart
                          </Button>
                        ) : (
                          <Button
                            className="w-full funnel-display-semibold"
                            onClick={() => addToCart(token)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          /* Cart View */
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="funnel-display-bold text-3xl">Shopping Cart</h2>
              <Button variant="ghost" onClick={() => setShowCart(false)}>
                Continue Shopping
              </Button>
            </div>

            {cart.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="funnel-display-medium text-xl mb-2">Your cart is empty</p>
                  <p className="text-muted-foreground mb-6">Add some tokens to get started</p>
                  <Button onClick={() => setShowCart(false)}>
                    Browse Tokens
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.map(item => {
                    const priceETH = (item.priceUSD / ETH_PRICE_USD).toFixed(6);
                    const totalUSD = item.priceUSD * item.quantity;
                    const totalETH = (totalUSD / ETH_PRICE_USD).toFixed(6);

                    return (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <h3 className="funnel-display-semibold">{item.name}</h3>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Unit Price:</span>
                                  <span>${item.priceUSD} ({priceETH} ETH)</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                  <span>Total:</span>
                                  <span>${totalUSD} ({totalETH} ETH)</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="funnel-display-medium w-8 text-center">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="h-8 w-8 p-0"
                                    disabled={userType === 'company'}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div>
                  <Card className="sticky top-24">
                    <CardContent className="p-6 space-y-6">
                      <h3 className="funnel-display-semibold text-xl">Order Summary</h3>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Tokens</span>
                          <span className="funnel-display-medium">{totals.totalTokens}</span>
                        </div>

                        <div className="border-t border-border pt-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="funnel-display-medium">Total (USD)</span>
                            <span className="funnel-display-semibold text-lg">${totals.totalUSD}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total (ETH)</span>
                            <span className="funnel-display-medium text-primary">{totals.totalETH} ETH</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full funnel-display-semibold"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={!walletConnected}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Checkout with ETH
                      </Button>

                      {!walletConnected && (
                        <p className="text-xs text-center text-muted-foreground">
                          Connect your wallet to checkout
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StorePage;
