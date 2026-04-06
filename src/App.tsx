import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ReportsPage from "./pages/ReportsPage";
import BeneficiariesPage from "./pages/BeneficiariesPage";
import CategoriesPage from "./pages/CategoriesPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import CalendarPage from "./pages/CalendarPage";
import PayeePage from "./pages/PayeePage";
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
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/beneficiarios" element={<BeneficiariesPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/metodos" element={<PaymentMethodsPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/payee/:id" element={<PayeePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
