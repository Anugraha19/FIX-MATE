// Customer dashboard - the numbers come from GET /api/bookings (stats calculated by MySQL).
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DashHead } from '../../components/DashboardLayout';
import BookingTable from '../../components/BookingTable';
import { Alert, EmptyState, Loading, StatCard } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { fetchBookings, selectBookings, selectBookingError, selectBookingStats, selectBookingStatus } from '../../redux/slices/bookingSlice';

export default function CustomerDashboard() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const bookings = useSelector(selectBookings);
  const stats = useSelector(selectBookingStats);
  const status = useSelector(selectBookingStatus);
  const error = useSelector(selectBookingError);

  useEffect(() => {
    dispatch(fetchBookings({ limit: 5 }));
  }, [dispatch]);

  // useMemo: build the card list only when the stats change
  const cards = useMemo(
    () => [
      { icon: 'clipboard', label: 'Total bookings', value: stats.total, dark: true },
      { icon: 'clock', label: 'Pending bookings', value: stats.byStatus.Pending || 0 },
      { icon: 'check', label: 'Completed services', value: stats.byStatus.Completed || 0 },
      { icon: 'close', label: 'Cancelled bookings', value: stats.byStatus.Cancelled || 0 },
    ],
    [stats]
  );

  return (
    <>
      <DashHead title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Here is what is happening with your home repairs.">
        <Link to="/booking" className="btn btn--primary">Book a service</Link>
      </DashHead>

      {error && <Alert onRetry={() => dispatch(fetchBookings({ limit: 5 }))}>{error}</Alert>}
      <div className="grid grid--stats">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="card table-card" style={{ marginTop: 24 }}>
        <div className="row between" style={{ padding: '18px 20px 8px' }}>
          <h3 style={{ margin: 0 }}>Recent bookings</h3>
          <Link to="/customer/bookings" className="btn btn--light btn--sm">View all</Link>
        </div>
        {status === 'loading' && bookings.length === 0 ? (
          <Loading />
        ) : bookings.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState icon="calendar" title="No bookings yet" message="Book your first service and it will show up here." action={<Link to="/services" className="btn btn--primary btn--sm">Browse services</Link>} />
          </div>
        ) : (
          <BookingTable bookings={bookings} viewer="customer" />
        )}
      </div>
    </>
  );
}
