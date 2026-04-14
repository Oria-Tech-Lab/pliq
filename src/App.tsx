import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import ReportsPage from "./pages/ReportsPage";
import BeneficiariesPage from "./pages/BeneficiariesPage";
import CategoriesPage from "./pages/CategoriesPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import CalendarPage from "./pages/CalendarPage";
import PayeePage from "./pages/PayeePage";
import PaymentPlansPage from "./pages/PaymentPlansPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/beneficiarios" element={<ProtectedRoute><BeneficiariesPage /></ProtectedRoute>} />
            <Route path="/categorias" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
            <Route path="/metodos" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
            <Route path="/calendario" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/planes" element={<ProtectedRoute><PaymentPlansPage /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/payee/:id" element={<ProtectedRoute><PayeePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
