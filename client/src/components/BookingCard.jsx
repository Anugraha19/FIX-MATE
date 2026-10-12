// BookingCard - one booking, shown the same way for customer, provider and admin.
//   <BookingCard booking={b} viewer="customer" actions={<button>...</button>} />
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { StatusBadge } from './ui';
import { formatDate, formatPrice, formatTime } from '../utils/format';

export default function BookingCard({ booking, viewer, actions }) {
  const providerName = booking.provider?.user?.name;
  return (
    <article className="card booking-card">
      <div className="booking-card__head">
        <div>
          <h3>{booking.service?.name}</h3>
          <span className="small muted">Booking #{booking.id}</span>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="booking-card__meta">
        <span><Icon name="calendar" size={16} /> {formatDate(booking.booking_date)}</span>
        <span><Icon name="clock" size={16} /> {formatTime(booking.booking_time)}</span>
        <span><Icon name="rupee" size={16} /> {formatPrice(booking.estimated_price)}</span>
        <span><Icon name="pin" size={16} /> {booking.address}</span>
        {viewer !== 'provider' && (
          <span>
            <Icon name="user" size={16} />{' '}
            {providerName ? (
              <Link to={`/providers/${booking.provider.id}`}>{providerName}</Link>
            ) : (
              'Provider not assigned yet'
            )}
          </span>
        )}
        {viewer !== 'customer' && booking.customer && (
          <span><Icon name="users" size={16} /> {booking.customer.name} - {booking.customer.phone}</span>
        )}
      </div>

      <p className="booking-card__problem">{booking.problem_description}</p>
      {booking.notes && <p className="small muted" style={{ margin: 0 }}>Notes: {booking.notes}</p>}

      {actions && <div className="booking-card__actions">{actions}</div>}
    </article>
  );
}
