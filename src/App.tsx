import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Students = lazy(() => import("./pages/Students"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Progress = lazy(() => import("./pages/Progress"));
const Finance = lazy(() => import("./pages/Finance"));
const Profile = lazy(() => import("./pages/Profile"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Subscription = lazy(() => import("./pages/Subscription"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = ({ queryClient }: { queryClient: QueryClient }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/portal" element={<StudentPortal />} />
                <Route path="/" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/billing" element={<AdminRoute><AdminBilling /></AdminRoute>} />
                <Route path="/admin/students" element={<AdminRoute><AdminStudents /></AdminRoute>} />
                <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
                <Route path="/update-password" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
