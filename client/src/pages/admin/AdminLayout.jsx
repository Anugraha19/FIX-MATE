import DashboardLayout from '../../components/DashboardLayout';

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/users', label: 'Customers', icon: 'users' },
  { to: '/admin/providers', label: 'Providers', icon: 'briefcase' },
  { to: '/admin/services', label: 'Services', icon: 'tools' },
  { to: '/admin/categories', label: 'Categories', icon: 'layers' },
  { to: '/admin/bookings', label: 'Bookings', icon: 'clipboard' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'star' },
  { to: '/admin/reports', label: 'Reports', icon: 'chart' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export default function AdminLayout() {
  return <DashboardLayout links={LINKS} roleLabel="admin" />;
}
