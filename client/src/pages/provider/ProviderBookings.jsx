// Provider job lists. One component, three screens chosen by `mode`:
//   requests  -> Pending / Confirmed / Assigned  (accept or reject)
//   active    -> Accepted / In Progress          (start job, mark completed)
//   completed -> Completed                       (history)
// Every button dispatches a Redux thunk -> PUT /api/bookings/:id/accept|reject|start|complete -> MySQL.
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashHead } from '../../components/DashboardLayout';
import BookingCard from '../../components/BookingCard';
import { ConfirmModal } from '../../components/Modal';
import { Alert, EmptyState, Loading, Pagination } from '../../components/ui';
import { clearActionError, fetchBookings, runBookingAction, selectActionError, selectBookingError, selectBookings, selectBookingStatus } from '../../redux/slices/bookingSlice';

const MODES = {
  requests: { title: 'Booking requests', subtitle: 'New jobs waiting for your answer.', status: 'Pending,Confirmed,Assigned', empty: 'No new requests right now.' },
  active: { title: 'Active jobs', subtitle: 'Accepted jobs and jobs in progress.', status: 'Accepted,In Progress', empty: 'You have no active jobs.' },
  completed: { title: 'Completed jobs', subtitle: 'Your service history.', status: 'Completed', empty: 'You have not completed any jobs yet.' },
};

export default function ProviderBookings({ mode = 'requests' }) {
  const dispatch = useDispatch();
  const bookings = useSelector(selectBookings);
  const status = useSelector(selectBookingStatus);
  const error = useSelector(selectBookingError);
  const actionError = useSelector(selectActionError);
  const { pages } = useSelector((state) => state.bookings);
  const [page, setPage] = useState(1);
  const [workingId, setWorkingId] = useState(null);
  const [toReject, setToReject] = useState(null);
  const config = MODES[mode];

  const load = useCallback(() => {
    dispatch(fetchBookings({ status: config.status, page, limit: 10 }));
  }, [dispatch, config.status, page]);

  useEffect(() => {
    setPage(1);
    dispatch(clearActionError());
  }, [mode, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (booking, action) => {
    setWorkingId(booking.id);
    await dispatch(runBookingAction({ id: booking.id, action }));
    setWorkingId(null);
    setToReject(null);
    load(); // the job moves to another list, so reload this one
  };

  const buttons = (b) => {
    const busy = workingId === b.id;
    if (['Pending', 'Confirmed', 'Assigned'].includes(b.status)) {
      return (
        <>
          <button type="button" className="btn btn--success btn--sm" disabled={busy} onClick={() => act(b, 'accept')}>Accept</button>
          <button type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={() => setToReject(b)}>Reject</button>
        </>
      );
    }
    if (b.status === 'Accepted') return <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => act(b, 'start')}>Start job</button>;
    if (b.status === 'In Progress') return <button type="button" className="btn btn--success btn--sm" disabled={busy} onClick={() => act(b, 'complete')}>Mark completed</button>;
    return null;
  };

  return (
    <>
      <DashHead title={config.title} subtitle={config.subtitle} />
      {error && <Alert onRetry={load}>{error}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}
      {status === 'loading' && bookings.length === 0 && <Loading text="Loading jobs..." />}
      {status !== 'loading' && !error && bookings.length === 0 && <EmptyState icon="clipboard" title={config.empty} />}

      <div className="stack" style={{ opacity: status === 'loading' ? 0.6 : 1 }}>
        {bookings.map((b) => <BookingCard key={b.id} booking={b} viewer="provider" actions={buttons(b)} />)}
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />

      {toReject && (
        <ConfirmModal
          title="Reject this request?"
          message={`${toReject.service?.name} for ${toReject.customer?.name}. Our team may offer the job to another provider.`}
          confirmLabel="Reject request"
          danger
          busy={workingId === toReject.id}
          onConfirm={() => act(toReject, 'reject')}
          onClose={() => setToReject(null)}
        />
      )}
    </>
  );
}
