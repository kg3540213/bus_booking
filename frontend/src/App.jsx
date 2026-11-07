import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import BookingCheckout from './pages/BookingCheckout';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import PNRLookup from './pages/PNRLookup';
import AdminDashboard from './pages/AdminDashboard';
import OperatorPortal from './pages/OperatorPortal';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Route Wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3">
        <h2 className="font-bold text-red-900 text-lg">Access Forbidden (403)</h2>
        <p className="text-xs text-red-700">
          Your current account role ({user.role}) is not authorized to access this resource.
        </p>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/checkout" element={<BookingCheckout />} />
              <Route path="/confirmation" element={<BookingConfirmation />} />
              <Route path="/pnr-lookup" element={<PNRLookup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer Bookings */}
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />

              {/* Admin Console */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Operator Portal */}
              <Route
                path="/operator"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}>
                    <OperatorPortal />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
