// Customer layout: sidebar links for the customer dashboard.
import DashboardLayout from '../../components/DashboardLayout';

const LINKS = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/customer/profile', label: 'My Profile', icon: 'user' },
  { to: '/customer/bookings', label: 'My Bookings', icon: 'list' },
  { to: '/customer/upcoming', label: 'Upcoming Services', icon: 'calendar' },
  { to: '/customer/history', label: 'Booking History', icon: 'history' },
  { to: '/customer/reviews', label: 'Reviews', icon: 'star' },
  { to: '/customer/settings', label: 'Settings', icon: 'settings' },
];

export default function CustomerLayout() {
  return <DashboardLayout links={LINKS} roleLabel="customer" />;
}
