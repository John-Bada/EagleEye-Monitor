import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CpuDashboard from "./components/CpuDashboard";
import MemoryDashboard from "./components/MemoryDashboard";
import DiskDashboard from "./components/DiskDashboard";
import NetworkDashboard from "./components/NetworkDashboard";
import GpuDashboard from "./components/GpuDashboard";
import Index from "./pages/Index";
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
                    <Route path="/cpu" element={<CpuDashboard />} />
                    <Route path="/memory" element={<MemoryDashboard />} />
                    <Route path="/disk" element={<DiskDashboard />} />
                    <Route path="/network" element={<NetworkDashboard />} />
                    <Route path="/gpu" element={<GpuDashboard />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
