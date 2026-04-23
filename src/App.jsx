import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

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
import GymBrowse from './pages/Gyms.jsx';
import GymDetail from './pages/GymDetail.jsx';
import GymRegister from './pages/GymRegister.jsx';
import GymOwnerDashboard from './pages/GymOwnerDashboard.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

export default function FitnessApp() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      <Route
        path="/login"
        element={user ? <Navigate to="/profile" replace /> : <LoginPage />}
      />

      <Route
        path="/signup"
        element={user ? <Navigate to="/profile" replace /> : <SignupPage />}
      />

      {/* Protected */}
      <Route path="/profile"   element={<ProtectedRoute><ErrorBoundary><ProfilePage /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/fitness"   element={<ProtectedRoute><ErrorBoundary><FitnessTracker /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/news"      element={<ProtectedRoute><ErrorBoundary><FitnessNews /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/reports"   element={<ProtectedRoute><ErrorBoundary><ReportsPage /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><ErrorBoundary><CommunityPage /></ErrorBoundary></ProtectedRoute>} />

      {/* Feed is accessible to everyone; personalization requires login */}
      <Route path="/feed" element={<ErrorBoundary><FeedPage /></ErrorBoundary>} />

      {/* Gyms — specific routes before dynamic :gymId */}
      <Route path="/gyms/register" element={<ProtectedRoute><ErrorBoundary><GymRegister /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/gyms/dashboard" element={<ProtectedRoute><ErrorBoundary><GymOwnerDashboard /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/gyms/:gymId" element={<ErrorBoundary><GymDetail /></ErrorBoundary>} />
      <Route path="/gyms" element={<ErrorBoundary><GymBrowse /></ErrorBoundary>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? "/profile" : "/about"} replace />} />
    </Routes>
  );
}
