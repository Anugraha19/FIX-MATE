// BookingTable - compact table of bookings. On phones each row becomes a card (see dashboard.css).
//   <BookingTable bookings={list} viewer="customer" renderActions={(b) => <button/>} />
import { Link } from 'react-router-dom';
import { StatusBadge } from './ui';
import { formatDate, formatPrice, formatTime } from '../utils/format';

export default function BookingTable({ bookings, viewer, renderActions }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Service</th>
            <th>Date and time</th>
            {viewer !== 'provider' && <th>Provider</th>}
            {viewer !== 'customer' && <th>Customer</th>}
            <th>Price</th>
            <th>Status</th>
            {renderActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td data-label="ID">#{b.id}</td>
              <td data-label="Service"><span className="cell-main">{b.service?.name}</span><span className="cell-sub">{b.service?.category?.name}</span></td>
              <td data-label="Date and time">{formatDate(b.booking_date)}<span className="cell-sub"> {formatTime(b.booking_time)}</span></td>
              {viewer !== 'provider' && (
                <td data-label="Provider">{b.provider ? <Link to={`/providers/${b.provider.id}`}>{b.provider.user.name}</Link> : <span className="muted">Not assigned</span>}</td>
              )}
              {viewer !== 'customer' && <td data-label="Customer">{b.customer?.name}</td>}
              <td data-label="Price">{formatPrice(b.estimated_price)}</td>
              <td data-label="Status"><StatusBadge status={b.status} /></td>
              {renderActions && <td className="cell-actions"><div className="actions">{renderActions(b)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
