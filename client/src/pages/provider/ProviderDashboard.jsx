// Provider dashboard - numbers come from GET /api/bookings (the server limits it to jobs assigned to this provider).
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DashHead } from '../../components/DashboardLayout';
import BookingTable from '../../components/BookingTable';
import { Alert, EmptyState, Loading, StatCard } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { fetchBookings, selectBookings, selectBookingError, selectBookingStats, selectBookingStatus } from '../../redux/slices/bookingSlice';
import { formatPrice } from '../../utils/format';

export default function ProviderDashboard() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const bookings = useSelector(selectBookings);
  const stats = useSelector(selectBookingStats);
  const status = useSelector(selectBookingStatus);
  const error = useSelector(selectBookingError);

  useEffect(() => {
    dispatch(fetchBookings({ limit: 5 }));
  }, [dispatch]);

  const cards = useMemo(() => {
    const by = stats.byStatus;
    return [
      { icon: 'clipboard', label: 'New requests', value: (by.Pending || 0) + (by.Confirmed || 0) + (by.Assigned || 0), dark: true },
      { icon: 'play', label: 'Active jobs', value: (by.Accepted || 0) + (by['In Progress'] || 0) },
      { icon: 'check', label: 'Completed jobs', value: by.Completed || 0 },
      { icon: 'rupee', label: 'Total earnings', value: formatPrice(stats.earnings) },
    ];
  }, [stats]);

  return (
    <>
      <DashHead title={`Welcome, ${user.name.split(' ')[0]}`} subtitle="Your requests, jobs and earnings at a glance.">
        <Link to="/provider/bookings" className="btn btn--primary">View booking requests</Link>
      </DashHead>

      {error && <Alert onRetry={() => dispatch(fetchBookings({ limit: 5 }))}>{error}</Alert>}
      <div className="grid grid--stats">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="card table-card" style={{ marginTop: 24 }}>
        <h3 style={{ margin: 0, padding: '18px 20px 8px' }}>Latest bookings</h3>
        {status === 'loading' && bookings.length === 0 ? (
          <Loading />
        ) : bookings.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState icon="clipboard" title="No jobs yet" message="Make sure your services and availability are set, so customers can book you." action={<Link to="/provider/services" className="btn btn--primary btn--sm">Set my services</Link>} />
          </div>
        ) : (
          <BookingTable bookings={bookings} viewer="provider" />
        )}
      </div>
    </>
  );
}
