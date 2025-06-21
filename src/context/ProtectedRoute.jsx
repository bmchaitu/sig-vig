// src/context/ProtectedRoute.js
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // ✅ Check for accessKey in query params (e.g., ?accessKey=12345)
  const searchParams = new URLSearchParams(location.search);
  const accessKey = searchParams.get("accessKey");

  // Allow access if accessKey is present
  if (accessKey) {
    return children;
  }

  // Show loader if auth state is still loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If user is not authenticated, show toast and redirect to login
  if (!isAuthenticated) {
    const toastEvent = new CustomEvent('toast', { 
      detail: { 
        type: 'warning', 
        message: 'Please log in to access this page.' 
      } 
    });
    window.dispatchEvent(toastEvent);

    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If authenticated or accessKey is valid, allow access
  return children;
};
