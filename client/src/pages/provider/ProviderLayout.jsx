import DashboardLayout from '../../components/DashboardLayout';

const LINKS = [
  { to: '/provider/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/provider/profile', label: 'My Profile', icon: 'user' },
  { to: '/provider/services', label: 'My Services', icon: 'tools' },
  { to: '/provider/bookings', label: 'Booking Requests', icon: 'clipboard' },
  { to: '/provider/active', label: 'Active Jobs', icon: 'play' },
  { to: '/provider/completed', label: 'Completed Jobs', icon: 'check' },
  { to: '/provider/availability', label: 'Availability', icon: 'calendar' },
  { to: '/provider/reviews', label: 'Reviews', icon: 'star' },
  { to: '/provider/settings', label: 'Settings', icon: 'settings' },
];

export default function ProviderLayout() {
  return <DashboardLayout links={LINKS} roleLabel="provider" />;
}
