// Helper functions that format values for display.

// MySQL DECIMAL values arrive as strings ("349.00"), so Number() first.
export const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// "2026-10-05" -> "5 Oct 2026"
export const formatDate = (value) => {
  if (!value) return '-';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// "14:00:00" -> "2:00 PM"
export const formatTime = (value) => {
  if (!value) return '-';
  const [h, m] = String(value).split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const formatDuration = (minutes) => {
  const m = Number(minutes || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} hr ${rest} min` : `${h} hr`;
};

// "In Progress" -> "in-progress" (used as a CSS class)
export const statusClass = (status) => String(status || '').toLowerCase().replace(/\s+/g, '-');

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

// "Pipe fitting, Leak repair" -> ["Pipe fitting", "Leak repair"]
export const splitSkills = (skills) => String(skills || '').split(',').map((s) => s.trim()).filter(Boolean);

// Today as YYYY-MM-DD in the browser's time zone (for date inputs).
export const todayISO = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const dashboardPathFor = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'provider') return '/provider/dashboard';
  return '/customer/dashboard';
};

// Basic validators used by forms (the server validates again - never trust the browser only).
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
export const isPhone = (v) => /^[0-9+\-\s]{7,15}$/.test(String(v).trim());
