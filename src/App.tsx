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
import Categories from "./pages/Categories";
import Sales from "./pages/Sales";
import Closing from "./pages/Closing";
import Locations from "./pages/Locations";
import Team from "./pages/Team";
import EmployeeDetail from "./pages/EmployeeDetail";
import MijnBeschikbaarheid from "./pages/mijn/Beschikbaarheid";
import MijnVerlof from "./pages/mijn/Verlof";
import TeamBeschikbaarheid from "./pages/team/Beschikbaarheid";
import TeamVerlof from "./pages/team/Verlof";
import TeamRoosters from "./pages/team/Roosters";
import MijnRooster from "./pages/mijn/Rooster";
import SettingsPage from "./pages/Settings";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes (no auth required) */}
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Authenticated routes */}
            <Route
              path="*"
              element={
                <RequireAuth>
                  <OrgProvider>
                    <NotificationsProvider>
                      <Routes>
                        <Route element={<AppLayout />}>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/kassa" element={<Register />} />
                          <Route path="/producten" element={<Products />} />
                          <Route path="/producten/categorieen" element={<Categories />} />
                          <Route path="/producten/modifier-groepen" element={<ModifierGroups />} />
                          <Route path="/verkopen" element={<Sales />} />
                          <Route path="/kasafsluiting" element={<Closing />} />
                          <Route path="/locaties" element={<Locations />} />
                          <Route path="/team" element={<Team />} />
                          <Route path="/team/:employeeId" element={<EmployeeDetail />} />
                          <Route path="/team/beschikbaarheid" element={<TeamBeschikbaarheid />} />
                          <Route path="/team/verlof" element={<TeamVerlof />} />
                          <Route path="/team/roosters" element={<TeamRoosters />} />
                          <Route path="/mijn/beschikbaarheid" element={<MijnBeschikbaarheid />} />
                          <Route path="/mijn/verlof" element={<MijnVerlof />} />
                          <Route path="/mijn/rooster" element={<MijnRooster />} />
                          <Route path="/instellingen" element={<SettingsPage />} />
                          <Route path="/abonnement" element={<Subscription />} />
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>
                    </NotificationsProvider>
                  </OrgProvider>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
