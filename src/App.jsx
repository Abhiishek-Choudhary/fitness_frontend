import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/Login.jsx';
import SignupPage from './pages/Signup.jsx';
import ProfilePage from './pages/Profile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FitnessTracker from './pages/FitnessTracker.jsx';
import FitnessNews from './pages/FitnessNews.jsx';
import ReportsPage from './pages/Reports.jsx';
import FeedPage from './pages/Feed.jsx';
import CommunityPage from './pages/Community.jsx';
import AboutPage from './pages/About.jsx';
import ContactPage from './pages/Contact.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

export default function FitnessApp() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (accessToken && savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }

    setAuthReady(true);
  }, []);

  const handleLoginSuccess = (userData) => setUser(userData);
  const handleSignupSuccess = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!authReady) return null; // prevent premature routing

  return (
    <Routes>
      {/* Public */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      <Route
        path="/login"
        element={user ? <Navigate to="/profile" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
      />

      <Route
        path="/signup"
        element={user ? <Navigate to="/profile" replace /> : <SignupPage onSignupSuccess={handleSignupSuccess} />}
      />

      {/* Protected */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user}>
            <ProfilePage user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/fitness"
        element={
          <ProtectedRoute user={user}>
            <FitnessTracker user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/news"
        element={
          <ProtectedRoute user={user}>
            <FitnessNews onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute user={user}>
            <ReportsPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Feed is accessible to everyone; personalization requires login */}
      <Route
        path="/feed"
        element={<FeedPage user={user} onLogout={handleLogout} />}
      />

      <Route
        path="/community"
        element={
          <ProtectedRoute user={user}>
            <CommunityPage user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Catch-all: unauthenticated users land on About page */}
      <Route
        path="*"
        element={<Navigate to={user ? "/profile" : "/about"} replace />}
      />
    </Routes>
  );
}
