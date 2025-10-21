import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowRight, Upload, Shield, Globe, Leaf, Users, TrendingUp, User, Home, BarChart3, Settings, Lock, Mail } from "lucide-react";
import heroImage from "@/assets/hero-forest.jpg";
import aiIcon from "@/assets/ai-verification-icon.jpg";
import blockchainIcon from "@/assets/blockchain-icon.jpg";
import marketplaceIcon from "@/assets/marketplace-icon.jpg";
import logo from "@/assets/logo.svg";
import ProfileModal from "./ProfileModal";
import PasswordChangeModal from "./PasswordChangeModal";
interface HomePageProps {
  userType: 'ngo' | 'company';
  onLogout: () => void;
  onDashboard: () => void;
  onAdminPanel?: () => void;
  onHome?: () => void;
}
const HomePage = ({
  userType,
  onLogout,
  onDashboard,
  onAdminPanel,
  onHome
}: HomePageProps) => {
  const [activeSection, setActiveSection] = useState<string>("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const handleLogoClick = () => {
    if (onHome) {
      onHome();
    } else {
      // Scroll to top or refresh current page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  const features = [{
    icon: aiIcon,
    title: "Upload tree images easily",
    description: "Simple mobile interface for communities to capture and upload tree photos with GPS verification"
  }, {
    icon: aiIcon,
    title: "AI-powered verification of carbon",
    description: "Advanced machine learning algorithms analyze tree species, health, and carbon sequestration potential"
  }, {
    icon: blockchainIcon,
    title: "Blockchain-secured registry",
    description: "Immutable record keeping ensures transparency and prevents double-counting of carbon credits"
  }, {
    icon: marketplaceIcon,
    title: "Direct marketplace, no middlemen",
    description: "Connect communities directly with companies for fair, transparent carbon credit transactions"
  }];
  const stats = [{
    value: "12,450",
    label: "Tonnes CO₂ Offset",
    icon: Leaf
  }, {
    value: "2,847",
    label: "Villagers Onboarded",
    icon: Users
  }, {
    value: "156",
    label: "Projects Verified",
    icon: Shield
  }, {
    value: "89%",
    label: "Verification Accuracy",
    icon: TrendingUp
  }];
  return <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 transition-colors duration-300 mx-0 my-0 px-[9px] py-0">
        <div className="container mx-auto flex items-center justify-between py-2 px-[31px]">
          <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
            <img src={logo} alt="Oronya" className="h-12 w-12 hover:scale-105 transition-transform" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => {
              setActiveSection("features");
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }} className="funnel-display-medium text-foreground hover:text-primary transition-colors">
              Features
            </button>
            <button onClick={() => {
              setActiveSection("how-it-works");
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }} className="funnel-display-medium text-foreground hover:text-primary transition-colors">
              How it Works
            </button>
            <button onClick={() => {
              setActiveSection("faq");
              document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
            }} className="funnel-display-medium text-foreground hover:text-primary transition-colors">
              FAQ
            </button>
            <button onClick={() => {
              setActiveSection("contact");
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
            }} className="funnel-display-medium text-foreground hover:text-primary transition-colors">
              Contact Us
            </button>
          </nav>

          {/* User Dropdown Menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-10 h-10 rounded-full p-0 bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary transition-colors">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-lg z-50 transition-colors">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={handleLogoClick}>
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={onDashboard}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={() => setShowProfileModal(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={() => setShowPasswordModal(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-100">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {onAdminPanel && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={onAdminPanel}>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
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

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} userType={userType} userId="demo-user" // In real app, this would come from auth context
    />

      {/* Password Change Modal */}
      <PasswordChangeModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} userId="demo-user" userEmail="user@example.com" // In real app, this would come from auth context
    />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20" style={{
        backgroundImage: `url(${heroImage})`
      }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/60" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="funnel-display-bold text-5xl md:text-7xl text-primary mb-6 hero-fade-in transition-colors">
              Turning Trees into Verified Carbon Credits
            </h1>
            <p className="funnel-display-normal text-xl md:text-2xl text-muted-foreground mb-8 hero-slide-up transition-colors">
              Helping communities earn and companies offset emissions transparently
            </p>
            <Button size="lg" onClick={onDashboard} className="funnel-display-semibold text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 hero-slide-up transition-colors">
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white transition-colors">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
            const Icon = stat.icon;
            return <div key={index} className="text-center animate-counter-up" style={{
              animationDelay: `${index * 0.1}s`
            }}>
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3 transition-colors" />
                  <div className="funnel-display-bold text-3xl md:text-4xl text-primary mb-1 transition-colors">
                    {stat.value}
                  </div>
                  <div className="funnel-display-medium text-muted-foreground transition-colors">
                    {stat.label}
                  </div>
                </div>;
          })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="funnel-display-bold text-4xl md:text-5xl text-primary mb-4 transition-colors">
              Revolutionizing Carbon Credits
            </h2>
            <p className="funnel-display-normal text-xl text-muted-foreground max-w-2xl mx-auto transition-colors">
              Our platform combines cutting-edge technology with community empowerment to create transparent, verifiable carbon credits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => <Card key={index} className="feature-card-hover bg-white border-border cursor-pointer hover:shadow-lg transition-all" onClick={onDashboard}>
                <CardContent className="p-6 text-center">
                  <img src={feature.icon} alt={feature.title} className="w-16 h-16 mx-auto mb-4 rounded-lg" />
                  <h3 className="funnel-display-semibold text-xl text-primary mb-3 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="funnel-display-normal text-muted-foreground transition-colors">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="funnel-display-bold text-4xl md:text-5xl text-primary mb-4 transition-colors">
              How It Works
            </h2>
            <p className="funnel-display-normal text-xl text-muted-foreground max-w-2xl mx-auto transition-colors">
              Simple steps to verify trees and generate carbon credits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="funnel-display-semibold text-xl text-primary mb-3 transition-colors">1. Upload Images</h3>
              <p className="funnel-display-normal text-muted-foreground transition-colors">
                Communities capture tree photos using our mobile app with GPS verification
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="funnel-display-semibold text-xl text-primary mb-3">2. AI Verification</h3>
              <p className="funnel-display-normal text-muted-foreground">
                Our AI analyzes tree species, health, and calculates carbon sequestration potential
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="funnel-display-semibold text-xl text-primary mb-3">3. Trade Credits</h3>
              <p className="funnel-display-normal text-muted-foreground">
                Verified credits are registered on blockchain and available for purchase by companies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden transition-colors">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-4">
              <span className="funnel-display-bold text-6xl md:text-7xl bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-pulse">
                FAQ
              </span>
            </div>
            <h2 className="funnel-display-bold text-3xl md:text-4xl text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="funnel-display-normal text-xl text-muted-foreground max-w-2xl mx-auto">
              Got questions? We've got answers 💡
            </p>
          </div>

          <Accordion type="single" collapsible className="max-w-3xl mx-auto space-y-4">
            <AccordionItem value="item-1" className="border-2 border-primary/20 rounded-2xl bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 px-6 animate-fade-in">
              <AccordionTrigger className="funnel-display-semibold text-lg text-primary hover:text-primary/80 py-6">
                How does the verification process work?
              </AccordionTrigger>
              <AccordionContent className="funnel-display-normal text-muted-foreground pb-6 pl-2">
                Our AI analyzes uploaded tree images using advanced machine learning to verify species, health, and carbon sequestration potential. Government officials then conduct final verification to ensure accuracy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-2 border-primary/20 rounded-2xl bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 px-6 animate-fade-in delay-100">
              <AccordionTrigger className="funnel-display-semibold text-lg text-primary hover:text-primary/80 py-6">
                How much can I earn per tree?
              </AccordionTrigger>
              <AccordionContent className="funnel-display-normal text-muted-foreground pb-6 pl-2">
                Earnings vary based on tree species, size, and carbon offset potential. Typically, verified trees can generate between ₹50-200 per tree annually through carbon credit sales.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-2 border-primary/20 rounded-2xl bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 px-6 animate-fade-in delay-200">
              <AccordionTrigger className="funnel-display-semibold text-lg text-primary hover:text-primary/80 py-6">
                Is the platform free to use?
              </AccordionTrigger>
              <AccordionContent className="funnel-display-normal text-muted-foreground pb-6 pl-2">
                Yes! For NGOs and communities, the platform is completely free. We only charge a small transaction fee (5%) when carbon credits are sold to companies.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-2 border-primary/20 rounded-2xl bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 px-6 animate-fade-in delay-300">
              <AccordionTrigger className="funnel-display-semibold text-lg text-primary hover:text-primary/80 py-6">
                How long does verification take?
              </AccordionTrigger>
              <AccordionContent className="funnel-display-normal text-muted-foreground pb-6 pl-2">
                AI verification is instant. Government verification typically takes 2-5 business days depending on the region and volume of submissions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="funnel-display-bold text-4xl md:text-5xl text-primary mb-4 transition-colors">
              Get in Touch
            </h2>
            <p className="funnel-display-normal text-xl text-muted-foreground max-w-2xl mx-auto transition-colors">
              Have questions or want to learn more? We're here to help
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="text-center p-6 bg-background rounded-lg border border-border transition-colors">
                <Mail className="h-8 w-8 text-primary mx-auto mb-3 transition-colors" />
                <h3 className="funnel-display-semibold text-lg mb-2">Email Us</h3>
                <p className="funnel-display-normal text-muted-foreground transition-colors">bireshwarofficial15@gmail.com</p>
              </div>
              <div className="text-center p-6 bg-background rounded-lg border border-border transition-colors">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3 transition-colors" />
                <h3 className="funnel-display-semibold text-lg mb-2">Support</h3>
                <p className="funnel-display-normal text-muted-foreground transition-colors">Available 24/7</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button size="lg" onClick={onDashboard} className="funnel-display-semibold">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="funnel-display-bold text-4xl md:text-5xl mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="funnel-display-normal text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of communities and companies creating a sustainable future together
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={onDashboard} className="funnel-display-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90">
              {userType === 'ngo' ? 'Start Uploading Trees' : 'Browse Carbon Credits'}
            </Button>
            <Button size="lg" variant="outline" onClick={onDashboard} className="funnel-display-semibold border-primary-foreground bg-[#efeae1] text-base text-[#293f33] text-center">
              Access Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={logo} alt="Oronya" className="h-10 w-10" />
              </div>
              <p className="funnel-display-normal opacity-80">
                Transparent carbon credit verification for a sustainable future.
              </p>
            </div>
            
            <div>
              <h3 className="funnel-display-semibold text-lg mb-4">Platform</h3>
              <ul className="space-y-2 funnel-display-normal opacity-80">
                <li>Features</li>
                <li>How it Works</li>
                <li>Pricing</li>
                <li>API</li>
              </ul>
            </div>
            
            <div>
              <h3 className="funnel-display-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2 funnel-display-normal opacity-80">
                <li>Documentation</li>
                <li>FAQ</li>
                <li>Contact Us</li>
                <li>Community</li>
              </ul>
            </div>
            
            <div>
              <h3 className="funnel-display-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-2 funnel-display-normal opacity-80">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
            <p className="funnel-display-normal opacity-80">Made by Team Oronya</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default HomePage;