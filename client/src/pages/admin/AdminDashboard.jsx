// Admin dashboard - GET /api/admin/dashboard. Every number is calculated by MySQL (COUNT / SUM queries).
import { Link } from 'react-router-dom';
import { DashHead } from '../../components/DashboardLayout';
import BookingTable from '../../components/BookingTable';
import { Alert, EmptyState, Loading, StatCard } from '../../components/ui';
import useFetch from '../../hooks/useFetch';
import { adminApi } from '../../services/api';
import { formatPrice } from '../../utils/format';

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch(() => adminApi.dashboard(), []);

  if (loading) return <Loading text="Loading dashboard..." />;
  if (error) return <Alert onRetry={reload}>{error}</Alert>;

  const { stats, recentBookings, monthly } = data;
  const maxMonth = Math.max(1, ...monthly.map((m) => m.bookings));

  return (
    <>
      <DashHead title="Admin dashboard" subtitle="A live view of the FixMate marketplace.">
        <Link to="/admin/reports" className="btn btn--outline">Open reports</Link>
      </DashHead>

      <div className="grid grid--stats">
        <StatCard icon="users" label="Total customers" value={stats.customers} dark />
        <StatCard icon="briefcase" label="Total providers" value={stats.providers} />
        <StatCard icon="tools" label="Total services" value={stats.services} />
        <StatCard icon="clipboard" label="Total bookings" value={stats.bookings} />
        <StatCard icon="clock" label="Pending bookings" value={stats.pending} />
        <StatCard icon="check" label="Completed bookings" value={stats.completed} />
        <StatCard icon="close" label="Cancelled bookings" value={stats.cancelled} />
        <StatCard icon="rupee" label="Revenue (completed)" value={formatPrice(stats.revenue)} />
      </div>

      <div className="panel-grid">
        <div className="card table-card">
          <div className="row between" style={{ padding: '18px 20px 8px' }}>
            <h3 style={{ margin: 0 }}>Recent bookings</h3>
            <Link to="/admin/bookings" className="btn btn--light btn--sm">Manage bookings</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div style={{ padding: 20 }}><EmptyState icon="clipboard" title="No bookings yet" /></div>
          ) : (
            <BookingTable bookings={recentBookings} viewer="admin" />
          )}
        </div>

        <div className="card">
          <h3 className="card__title">Bookings per month</h3>
          {monthly.length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <div className="bar-chart" role="img" aria-label="Bar chart of bookings per month">
              {monthly.map((m) => (
                <div className="bar-chart__item" key={m.month}>
                  <span className="bar-chart__value">{m.bookings}</span>
                  <div className="bar-chart__bar" style={{ height: `${(m.bookings / maxMonth) * 100}%` }} />
                  <span>{m.month.slice(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
