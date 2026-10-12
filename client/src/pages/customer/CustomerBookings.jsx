// Customer bookings. One component shows three screens, chosen by the `mode` prop:
//   all      -> /customer/bookings   (with a status filter)
//   upcoming -> /customer/upcoming
//   history  -> /customer/history
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DashHead } from '../../components/DashboardLayout';
import BookingCard from '../../components/BookingCard';
import { ConfirmModal } from '../../components/Modal';
import ReviewModal from '../../components/ReviewModal';
import { Alert, EmptyState, Loading, Pagination } from '../../components/ui';
import { cancelBooking, clearActionError, fetchBookings, selectActionError, selectBookingError, selectBookings, selectBookingStatus } from '../../redux/slices/bookingSlice';

const TITLES = {
  all: ['My bookings', 'Every service you have booked with FixMate.'],
  upcoming: ['Upcoming services', 'Bookings that are still waiting or scheduled.'],
  history: ['Booking history', 'Completed, cancelled and rejected bookings.'],
};
const CANCELLABLE = ['Pending', 'Confirmed', 'Assigned'];
const STATUSES = ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

export default function CustomerBookings({ mode = 'all' }) {
  const dispatch = useDispatch();
  const bookings = useSelector(selectBookings);
  const status = useSelector(selectBookingStatus);
  const error = useSelector(selectBookingError);
  const actionError = useSelector(selectActionError);
  const { pages } = useSelector((state) => state.bookings);

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [toCancel, setToCancel] = useState(null);
  const [toReview, setToReview] = useState(null);
  const [busy, setBusy] = useState(false);

  // useCallback: one stable function for loading the list
  const load = useCallback(() => {
    const params = { page, limit: 10 };
    if (mode === 'upcoming') params.when = 'upcoming';
    if (mode === 'history') params.when = 'history';
    if (mode === 'all' && statusFilter) params.status = statusFilter;
    dispatch(fetchBookings(params));
  }, [dispatch, mode, page, statusFilter]);

  useEffect(() => {
    dispatch(clearActionError());
  }, [dispatch, mode]);

  useEffect(() => {
    setPage(1);
    setStatusFilter('');
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmCancel = async () => {
    setBusy(true);
    await dispatch(cancelBooking(toCancel.id));
    setBusy(false);
    setToCancel(null);
    load(); // refresh the dashboard numbers too
  };

  const [title, subtitle] = TITLES[mode];

  return (
    <>
      <DashHead title={title} subtitle={subtitle}>
        <Link to="/booking" className="btn btn--primary">Book a service</Link>
      </DashHead>

      {mode === 'all' && (
        <div className="toolbar">
          <select className="select" aria-label="Filter by status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {error && <Alert onRetry={load}>{error}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}
      {status === 'loading' && bookings.length === 0 && <Loading text="Loading your bookings..." />}

      {status !== 'loading' && !error && bookings.length === 0 && (
        <EmptyState icon="calendar" title="Nothing here yet" message="When you book a service it will appear on this page." action={<Link to="/services" className="btn btn--primary btn--sm">Browse services</Link>} />
      )}

      <div className="stack" style={{ opacity: status === 'loading' ? 0.6 : 1 }}>
        {bookings.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            viewer="customer"
            actions={
              <>
                <Link to={`/services/${b.service_id}`} className="btn btn--light btn--sm">View service</Link>
                {CANCELLABLE.includes(b.status) && (
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setToCancel(b)}>Cancel booking</button>
                )}
                {b.status === 'Completed' && !b.review && b.provider && (
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => setToReview(b)}>Leave a review</button>
                )}
                {b.review && <span className="tag">You rated {b.review.rating}/5</span>}
              </>
            }
          />
        ))}
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />

      {toCancel && (
        <ConfirmModal
          title="Cancel this booking?"
          message={`${toCancel.service?.name} on ${toCancel.booking_date}. This cannot be undone.`}
          confirmLabel="Cancel booking"
          danger
          busy={busy}
          onConfirm={confirmCancel}
          onClose={() => setToCancel(null)}
        />
      )}
      {toReview && (
        <ReviewModal
          booking={toReview}
          onClose={() => setToReview(null)}
          onDone={() => {
            setToReview(null);
            load();
          }}
        />
      )}
    </>
  );
}
