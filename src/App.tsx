import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import NFT from "@/pages/NFT";
import Registry from "@/pages/Registry";
import SponsorPool from "@/pages/SponsorPool";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import VerifierStatus from "./pages/VerifierStatus";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Challenges from "./pages/Challenges";
import Metrics from "./pages/Metrics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/verifier" element={<VerifierStatus />} />
          <Route path="/about" element={<About />} />
          <Route path="/u/:wallet" element={<Profile />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/metrics" element={<Metrics />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/pool" element={<SponsorPool />} />
          <Route path="/nft" element={<NFT />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
