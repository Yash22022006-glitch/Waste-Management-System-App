import React, { useState, useEffect, createContext, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { authService } from './services/authService';
import { AuthContextType, User, UserRole } from './types';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

// Context for authentication
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    if (isAuthenticated && isAuthPage) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAuthPage, navigate]);

  const login = useCallback((newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', newToken);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    navigate('/login');
  }, [navigate]);

  const isAdmin = user?.role === UserRole.ADMIN;

  const authContextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isAdmin,
  };

  const showChrome = isAuthenticated && !isAuthPage;

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="h-screen w-screen overflow-hidden bg-[var(--bg)] relative flex flex-col font-sans">
        {/* Immersive Background Elements */}
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
        
        {showChrome && (
          <Header user={user} onLogout={logout} />
        )}
        
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 overflow-hidden relative flex flex-col">
            <div className={`flex-1 overflow-y-auto no-scrollbar ${showChrome ? 'pt-16 pb-20 sm:pb-0' : ''}`}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                <Route path="/" element={<ProtectedRoute />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="reports" element={<ProtectedRoute allowedRoles={[UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER]}><ReportsPage /></ProtectedRoute>} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><SettingsPage /></ProtectedRoute>} />
                </Route>

                <Route path="*" element={isAuthenticated ? <DashboardPage /> : <LoginPage />} />
              </Routes>
            </div>
          </main>
          {showChrome && <BottomNav user={user} />}
        </div>
      </div>
    </AuthContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;