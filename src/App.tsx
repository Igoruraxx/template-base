import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Students from "./pages/Students";
import Schedule from "./pages/Schedule";
import Progress from "./pages/Progress";
import Finance from "./pages/Finance";
import Profile from "./pages/Profile";
import StudentPortal from "./pages/StudentPortal";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminStudents from "./pages/admin/AdminStudents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/portal" element={<StudentPortal />} />
            <Route path="/" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/billing" element={<AdminRoute><AdminBilling /></AdminRoute>} />
            <Route path="/admin/students" element={<AdminRoute><AdminStudents /></AdminRoute>} />
            <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
