import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import GovAuthPage from "./pages/GovAuthPage";
import GovVerifyPage from "./pages/GovVerifyPage";
import MarketplacePage from "./pages/MarketplacePage";
import StorePage from "./pages/StorePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/users" element={<AdminPage />} />
          <Route path="/admin/companies" element={<AdminPage />} />
          <Route path="/admin/government" element={<AdminPage />} />
          <Route path="/gov-auth" element={<GovAuthPage />} />
          <Route path="/gov-verify" element={<GovVerifyPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
