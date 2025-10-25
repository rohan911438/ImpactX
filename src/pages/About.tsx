import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Brain, Lock, Coins, Github, FileText, Zap, Shield, Users } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: <Globe className="w-8 h-8 text-primary" />,
      title: "Built on Celo",
      description: "Leveraging Celo's carbon-neutral blockchain for sustainable, global impact at minimal cost.",
    },
    {
      icon: <Brain className="w-8 h-8 text-secondary" />,
      title: "AI Verification",
      description: "Advanced AI models verify proof of impact with high accuracy, ensuring only genuine actions are rewarded.",
    },
    {
      icon: <Lock className="w-8 h-8 text-accent" />,
      title: "zk-Proof Privacy",
      description: "Zero-knowledge proofs protect user privacy while maintaining transparent verification standards.",
    },
    {
      icon: <Coins className="w-8 h-8 text-primary" />,
      title: "On-Chain Rewards",
      description: "Earn cUSD tokens and unique Proof-of-Impact NFTs for every verified contribution.",
    },
    {
      icon: <Shield className="w-8 h-8 text-secondary" />,
      title: "Decentralized Trust",
      description: "Smart contracts ensure fair, transparent, and immutable reward distribution.",
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: "Global Community",
      description: "Join thousands of impact makers worldwide creating positive change together.",
    },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4">
            About <span className="gradient-hero bg-clip-text text-transparent">ImpactX</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Empowering individuals to create real-world impact through AI-verified proof-of-action, 
            blockchain rewards, and a global community committed to positive change.
          </p>
        </div>
        
        {/* Mission Statement */}
        <Card className="glass-effect mb-12 glow-effect">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Our Mission 🌍</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-center text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              ImpactX bridges the gap between intention and action. We believe that every positive deed deserves 
              recognition and reward. By combining cutting-edge AI verification with blockchain technology, 
              we're creating a transparent, trustless system that incentivizes real-world impact. From planting trees 
              to teaching communities, every action counts—and every action is rewarded.
            </p>
          </CardContent>
        </Card>
        
        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works ⚡</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="glass-effect hover:glow-effect transition-all duration-300">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Technology Stack */}
        <Card className="glass-effect mb-12">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Technology Stack
            </CardTitle>
            <CardDescription>Built with cutting-edge blockchain and AI technologies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-primary">Blockchain Layer</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Celo - Carbon-negative blockchain</li>
                  <li>• Smart Contracts for PoI NFT minting</li>
                  <li>• cUSD stablecoin rewards</li>
                  <li>• Decentralized storage via IPFS</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-secondary">AI & Privacy</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Computer Vision for image verification</li>
                  <li>• Machine Learning confidence scoring</li>
                  <li>• Zero-knowledge proof protocols</li>
                  <li>• Privacy-preserving verification</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-effect text-center">
            <CardContent className="pt-6">
              <p className="text-5xl font-bold gradient-hero bg-clip-text text-transparent mb-2">10K+</p>
              <p className="text-muted-foreground">Actions Verified</p>
            </CardContent>
          </Card>
          <Card className="glass-effect text-center">
            <CardContent className="pt-6">
              <p className="text-5xl font-bold text-accent mb-2">$125K</p>
              <p className="text-muted-foreground">Rewards Distributed</p>
            </CardContent>
          </Card>
          <Card className="glass-effect text-center">
            <CardContent className="pt-6">
              <p className="text-5xl font-bold text-secondary mb-2">3.5K</p>
              <p className="text-muted-foreground">Active Impact Makers</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Resources */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-2xl">Learn More 📚</CardTitle>
            <CardDescription>Explore our documentation and join the community</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="default" className="gap-2" size="lg">
              <Github className="w-5 h-5" />
              View on GitHub
            </Button>
            <Button variant="outline" className="gap-2" size="lg">
              <FileText className="w-5 h-5" />
              Read Whitepaper
            </Button>
            <Button variant="outline" className="gap-2" size="lg">
              <Globe className="w-5 h-5" />
              Join Discord
            </Button>
          </CardContent>
        </Card>
        
        {/* Footer Note */}
        <div className="text-center mt-12 p-8 rounded-lg bg-muted/20">
          <p className="text-muted-foreground italic">
            "The best time to plant a tree was 20 years ago. The second best time is now. 
            But the best time to get rewarded for it? Right here on ImpactX." 🌱
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
