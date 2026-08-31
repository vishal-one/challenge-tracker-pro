import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { CreateChallenge } from './pages/admin/CreateChallenge';
import { AdminCohorts } from './pages/admin/AdminCohorts';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminManageChallenges } from './pages/admin/AdminManageChallenges';
import { EditChallenge } from './pages/admin/EditChallenge';
import { UserDashboard } from './pages/user/Dashboard';
import { ChallengeDetail } from './pages/user/ChallengeDetail';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Account } from './pages/Account';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 30, // 30 seconds — keeps dashboards fresh (PERF-01 fix)
    },
  },
});

const RoleBasedRedirect: React.FC = () => {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/my-challenges'} replace />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono text-xs text-neutral-muted gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-violet border-t-transparent animate-spin" />
        <span>AUTHENTICATING SESSION...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (role !== 'admin') {
    return <Navigate to="/my-challenges" replace />;
  }
  return <>{children}</>;
};

export function AppRoutes() {
  const { user, isLoading } = useAuth();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isLoading ? (
            <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-neutral-muted">
              <div className="w-8 h-8 rounded-full border-2 border-violet border-t-transparent animate-spin" />
            </div>
          ) : user ? (
            <RoleBasedRedirect />
          ) : (
            <Login />
          )
        }
      />

      {/* Authenticated Application Routes (Protected & Wrapped in Layout) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Default root redirect */}
                <Route path="/" element={<RoleBasedRedirect />} />

                {/* ── SHARED ROUTES (Accessible to BOTH Admin and Student) ── */}
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/account" element={<Account />} />

                {/* ── ADMIN ONLY ROUTES ── */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/challenges/new"
                  element={
                    <AdminRoute>
                      <CreateChallenge />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/challenges"
                  element={
                    <AdminRoute>
                      <AdminManageChallenges />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/challenges/edit/:id"
                  element={
                    <AdminRoute>
                      <EditChallenge />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cohorts"
                  element={
                    <AdminRoute>
                      <AdminCohorts />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/reviews"
                  element={
                    <AdminRoute>
                      <AdminReviews />
                    </AdminRoute>
                  }
                />

                {/* ── STUDENT / USER ROUTES ── */}
                <Route path="/my-challenges" element={<UserDashboard />} />
                <Route path="/my-challenges/:id" element={<ChallengeDetail />} />

                {/* Fallback Catch-all Route */}
                <Route path="*" element={<RoleBasedRedirect />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
