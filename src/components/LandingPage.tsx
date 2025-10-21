import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Upload, Shield, Globe, Leaf, Users, TrendingUp, Mail } from "lucide-react";
import heroImage from "@/assets/hero-forest.jpg";
import aiIcon from "@/assets/ai-verification-icon.jpg";
import blockchainIcon from "@/assets/blockchain-icon.jpg";
import marketplaceIcon from "@/assets/marketplace-icon.jpg";
import logo from "@/assets/logo.svg";
interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}
const LandingPage = ({
  onLoginClick,
  onSignupClick
}: LandingPageProps) => {
  const [activeSection, setActiveSection] = useState<string>("");
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
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="Oronya" className="h-12 w-12" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-2">
            <button onClick={() => {
            setActiveSection("features");
            document.getElementById("features")?.scrollIntoView({
              behavior: "smooth"
            });
          }} className={`funnel-display-medium px-6 py-2.5 rounded-full transition-all duration-300 ${activeSection === "features" ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5"}`}>
              Features
            </button>
            <button onClick={() => {
            setActiveSection("how-it-works");
            document.getElementById("how-it-works")?.scrollIntoView({
              behavior: "smooth"
            });
          }} className={`funnel-display-medium px-6 py-2.5 rounded-full transition-all duration-300 ${activeSection === "how-it-works" ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5"}`}>
              How it Works
            </button>
            <button onClick={() => {
            setActiveSection("faq");
            document.getElementById("faq")?.scrollIntoView({
              behavior: "smooth"
            });
          }} className={`funnel-display-medium px-6 py-2.5 rounded-full transition-all duration-300 ${activeSection === "faq" ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5"}`}>
              FAQ
            </button>
            <a href="/admin" className="funnel-display-medium px-6 py-2.5 rounded-full transition-all duration-300 text-foreground hover:bg-foreground/5">
              Admin Panel
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={onLoginClick} className="funnel-display-medium">
              Login
            </Button>
            <Button onClick={onSignupClick} className="funnel-display-medium bg-primary text-primary-foreground hover:bg-primary/90">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20" style={{
        backgroundImage: `url(${heroImage})`
      }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/60" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="funnel-display-bold text-5xl md:text-7xl text-primary mb-6 hero-fade-in">
              Turning Trees into Verified Carbon Credits
            </h1>
            <p className="funnel-display-normal text-xl md:text-2xl text-muted-foreground mb-8 hero-slide-up">
              Helping communities earn and companies offset emissions transparently
            </p>
            <Button size="lg" onClick={onLoginClick} className="funnel-display-semibold text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 hero-slide-up">
              Explore How It Works
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
            const Icon = stat.icon;
            return <div key={index} className="text-center animate-counter-up" style={{
              animationDelay: `${index * 0.1}s`
            }}>
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="funnel-display-bold text-3xl md:text-4xl text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="funnel-display-medium text-muted-foreground">
                    {stat.label}
                  </div>
                </div>;
          })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="funnel-display-bold text-4xl md:text-5xl text-primary mb-4">
              Revolutionizing Carbon Credits
            </h2>
            <p className="funnel-display-normal text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with community empowerment to create transparent, verifiable carbon credits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => <Card key={index} className="feature-card-hover bg-white border-border">
                <CardContent className="p-6 text-center">
                  <img src={feature.icon} alt={feature.title} className="w-16 h-16 mx-auto mb-4 rounded-lg" />
                  <h3 className="funnel-display-semibold text-xl text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="funnel-display-normal text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="funnel-display-bold text-4xl md:text-5xl text-primary mb-4">
              How It Works
            </h2>
            <p className="funnel-display-normal text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to verify trees and generate carbon credits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="funnel-display-semibold text-xl text-primary mb-3">1. Upload Images</h3>
              <p className="funnel-display-normal text-muted-foreground">
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
      <section id="faq" className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
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
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="funnel-display-bold text-4xl md:text-5xl text-primary mb-4">
              Get in Touch
            </h2>
            <p className="funnel-display-normal text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions or want to learn more? We're here to help
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="text-center p-6 bg-background rounded-lg border border-border">
                <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="funnel-display-semibold text-lg mb-2">Email Us</h3>
                <p className="funnel-display-normal text-muted-foreground">bireshwarofficial15@gmail.com</p>
              </div>
              <div className="text-center p-6 bg-background rounded-lg border border-border">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="funnel-display-semibold text-lg mb-2">Support</h3>
                <p className="funnel-display-normal text-muted-foreground">Available 24/7</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button size="lg" onClick={onSignupClick} className="funnel-display-semibold">
                Get Started Today
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
            <Button size="lg" onClick={onSignupClick} className="funnel-display-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Start as Community
            </Button>
            <Button size="lg" variant="outline" onClick={onSignupClick} className="funnel-display-semibold border-primary-foreground bg-[#efeae1] text-base text-[#293f33] text-center">
              Join as Company
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
export default LandingPage;