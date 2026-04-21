import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { OrgProvider } from "@/context/OrgContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ModifierGroups from "./pages/ModifierGroups";
import Sales from "./pages/Sales";
import Closing from "./pages/Closing";
import Locations from "./pages/Locations";
import Team from "./pages/Team";
import EmployeeDetail from "./pages/EmployeeDetail";
import SettingsPage from "./pages/Settings";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RequireAuth>
          <OrgProvider>
            <NotificationsProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/kassa" element={<Register />} />
                    <Route path="/producten" element={<Products />} />
                    <Route path="/producten/modifier-groepen" element={<ModifierGroups />} />
                    <Route path="/verkopen" element={<Sales />} />
                    <Route path="/kasafsluiting" element={<Closing />} />
                    <Route path="/locaties" element={<Locations />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/team/:employeeId" element={<EmployeeDetail />} />
                    <Route path="/instellingen" element={<SettingsPage />} />
                    <Route path="/abonnement" element={<Subscription />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </NotificationsProvider>
          </OrgProvider>
        </RequireAuth>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
