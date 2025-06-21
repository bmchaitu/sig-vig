import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';

import Dashboard from './pages/Dashboard';
import PrrChiAnalysis from './pages/PrrChiAnalysis';
import EbgmAnalysis from './pages/EbgmAnalysis';
import { ProtectedRoute } from './context/ProtectedRoute';

// Create a wrapper component to handle navbar rendering
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen">
      {!isLoginPage && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/prr-chi" 
          element={
            <ProtectedRoute>
              <PrrChiAnalysis />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ebgm" 
          element={
            <ProtectedRoute>
              <EbgmAnalysis />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;