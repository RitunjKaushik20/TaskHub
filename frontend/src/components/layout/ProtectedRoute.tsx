import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import SplashScreen from '../common/SplashScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait for session hydration to finish before evaluating authentication or role
  if (isLoading) {
    return <SplashScreen />;
  }

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('access_token'))
    : null;

  // If token is present but user profile is still loading into state, prevent transient redirects
  if (token && !user) {
    return <SplashScreen />;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict role boundaries:
  // - Users with role === 'BUSINESS' can ONLY access /business routes. If they try to open /worker, redirect to /business.
  // - Users with role === 'WORKER' can ONLY access /worker routes. If they try to open /business, redirect to /worker.
  if (user.role === 'BUSINESS' && !allowedRoles.includes('BUSINESS')) {
    return <Navigate to="/business" replace />;
  }

  if (user.role === 'WORKER' && !allowedRoles.includes('WORKER')) {
    return <Navigate to="/worker" replace />;
  }

  if (user.role === 'ADMIN' && !allowedRoles.includes('ADMIN')) {
    return <Navigate to="/admin" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const fallbackDestination = user.role === 'BUSINESS' ? '/business' : user.role === 'ADMIN' ? '/admin' : '/worker';
    return <Navigate to={fallbackDestination} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
