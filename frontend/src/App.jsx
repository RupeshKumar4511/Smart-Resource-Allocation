import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './features/auth/authSlice';

import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import WorkspaceFormPage from './pages/WorkspaceFormPage';
import ProfilePage from './pages/ProfilePage';
import WorkspaceView from './pages/WorkspaceView';

function ProtectedRoute({ children }) {
  const { user, loading } = useSelector((s) => s.auth);

  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useSelector((s) => s.auth);
  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // ✅ Only attempt to restore session if there's a hint
    // that the user was previously logged in
    const wasLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (wasLoggedIn) {
      dispatch(fetchMe());
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Guest routes */}
        <Route path="/" element={<GuestRoute><WelcomePage /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyOtpPage />} />

        {/* ✅ Fixed: use /app as the parent layout route, not "/" */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="home" element={<HomePage />} />
          <Route path="workspace/new" element={<WorkspaceFormPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="workspace/:id/*" element={<WorkspaceView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}