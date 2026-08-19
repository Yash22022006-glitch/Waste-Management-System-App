import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  // Add children prop to allow ProtectedRoute to wrap and render child components directly.
  children?: React.ReactNode; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard or a specific unauthorized page if role not allowed
    return <Navigate to="/dashboard" replace />;
  }

  // If children are provided (meaning this ProtectedRoute is wrapping a specific component), render them.
  // Otherwise (meaning this ProtectedRoute is acting as a layout route for nested routes), render Outlet.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;