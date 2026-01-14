import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth";
import Index from "./pages/Index";
import Pending from "./pages/Pending";
import Tasks from "./pages/Tasks";
import Procedures from "./pages/Procedures";
import Decisions from "./pages/Decisions";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserManagement from "./pages/UserManagement";
import Projects from "./pages/Projects";
import Security from "./pages/Security";
import Profile from "./pages/Profile";
import Permissions from "./pages/Permissions";
import ApproveTask from "./pages/ApproveTask";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/approve/:token" element={<ApproveTask />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/pending" element={<ProtectedRoute><Pending /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/procedures" element={<ProtectedRoute><Procedures /></ProtectedRoute>} />
            <Route path="/decisions" element={<ProtectedRoute><Decisions /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/permissions" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
