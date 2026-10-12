// App.jsx - all routes of the website (React Router).
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import PublicLayout from './components/PublicLayout';
import AuthLayout from './components/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import Providers from './pages/Providers';
import ProviderDetails from './pages/ProviderDetails';
import Booking from './pages/Booking';
import BookingConfirmation from './pages/BookingConfirmation';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

import ProfilePage from './pages/shared/ProfilePage';
import SettingsPage from './pages/shared/SettingsPage';

import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerBookings from './pages/customer/CustomerBookings';
import CustomerReviews from './pages/customer/CustomerReviews';

import ProviderLayout from './pages/provider/ProviderLayout';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderBookings from './pages/provider/ProviderBookings';
import ProviderAvailability from './pages/provider/ProviderAvailability';
import ProviderServices from './pages/provider/ProviderServices';
import ProviderReviews from './pages/provider/ProviderReviews';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProviders from './pages/admin/AdminProviders';
import AdminServices from './pages/admin/AdminServices';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';

// Scroll to the top whenever the page changes.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Chatbot />
      <Routes>
        {/* Login and register use the Figma-style layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/providers/:id" element={<ProviderDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Only customers can book */}
          <Route element={<ProtectedRoute roles={['customer']} />}>
            <Route path="/booking" element={<Booking />} />
            <Route path="/booking/confirmation" element={<BookingConfirmation />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Customer dashboard */}
        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="bookings" element={<CustomerBookings mode="all" />} />
            <Route path="upcoming" element={<CustomerBookings mode="upcoming" />} />
            <Route path="history" element={<CustomerBookings mode="history" />} />
            <Route path="reviews" element={<CustomerReviews />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Provider dashboard */}
        <Route element={<ProtectedRoute roles={['provider']} />}>
          <Route path="/provider" element={<ProviderLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ProviderDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="services" element={<ProviderServices />} />
            <Route path="bookings" element={<ProviderBookings mode="requests" />} />
            <Route path="active" element={<ProviderBookings mode="active" />} />
            <Route path="completed" element={<ProviderBookings mode="completed" />} />
            <Route path="availability" element={<ProviderAvailability />} />
            <Route path="reviews" element={<ProviderReviews />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Admin dashboard */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="providers" element={<AdminProviders />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
