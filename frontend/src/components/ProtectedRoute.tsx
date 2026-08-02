import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Array<'admin' | 'manager' | 'learner'>;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-vantage-900 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground font-medium">Verifying Vantage credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl glass-card border border-destructive/30 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Your role (<span className="capitalize font-semibold text-foreground">{user.role}</span>) does not have permission to access this enterprise module.
        </p>
        <Navigate to="/courses" replace />
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
