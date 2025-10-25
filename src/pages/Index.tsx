import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { UploadProof } from "@/components/UploadProof";
import { ImpactShowcase } from "@/components/ImpactShowcase";
import { Features } from "@/components/Features";
import { Stats } from "@/components/Stats";
import { Testimonials } from "@/components/Testimonials";
import { Partners } from "@/components/Partners";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { WalletConnect } from "@/components/WalletConnect";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleConnectWallet = () => {
    toast({
      title: "Wallet Connected",
      description: "Welcome to ImpactX! Redirecting to your dashboard...",
    });
    
    // Simulate wallet connection and redirect to dashboard
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen md:pl-64">
      <WalletConnect />
      <Hero onConnectWallet={handleConnectWallet} />
      <Partners />
      <HowItWorks />
      <Features />
      <Stats />
      <UploadProof />
      <ImpactShowcase />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
