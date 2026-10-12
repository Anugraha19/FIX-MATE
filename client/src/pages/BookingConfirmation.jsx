// Booking confirmation - shows the booking that was just saved (kept in the Redux bookingSlice).
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Icon from '../components/Icon';
import { StatusBadge } from '../components/ui';
import { selectLastBooking } from '../redux/slices/bookingSlice';
import { formatDate, formatPrice, formatTime } from '../utils/format';

export default function BookingConfirmation() {
  const booking = useSelector(selectLastBooking);

  // opened directly without booking first? go to the bookings list
  if (!booking) return <Navigate to="/customer/bookings" replace />;

  return (
    <div className="container page-body" style={{ maxWidth: 720 }}>
      <div className="card center" style={{ padding: 36 }}>
        <span className="icon-tile" style={{ background: '#e0f1e7', color: 'var(--ok)', width: 64, height: 64, borderRadius: '50%' }}>
          <Icon name="check" size={32} strokeWidth={2.5} />
        </span>
        <h1 style={{ fontSize: '1.9rem', marginTop: 16 }}>Booking received</h1>
        <p className="muted">
          {booking.provider
            ? `${booking.provider.user.name} will review your request and confirm it shortly.`
            : 'Our team will assign a provider and confirm your booking shortly.'}
        </p>

        <dl className="summary-list" style={{ textAlign: 'left', margin: '24px 0', padding: 20, background: 'var(--sand-50)', borderRadius: 14 }}>
          <dt>Booking ID</dt><dd>#{booking.id}</dd>
          <dt>Service</dt><dd>{booking.service?.name}</dd>
          <dt>Provider</dt><dd>{booking.provider?.user?.name || 'To be assigned'}</dd>
          <dt>Date</dt><dd>{formatDate(booking.booking_date)}</dd>
          <dt>Time</dt><dd>{formatTime(booking.booking_time)}</dd>
          <dt>Address</dt><dd>{booking.address}</dd>
          <dt>Estimated price</dt><dd>{formatPrice(booking.estimated_price)}</dd>
          <dt>Status</dt><dd><StatusBadge status={booking.status} /></dd>
        </dl>

        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to="/customer/bookings" className="btn btn--primary">View my bookings</Link>
          <Link to="/services" className="btn btn--outline">Book another service</Link>
        </div>
      </div>
    </div>
  );
}
