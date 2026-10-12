// Admin: bookings - view, assign a provider and change status (PUT /api/admin/bookings/:id/assign | /status).
import { useState } from 'react';
import { DashHead } from '../../components/DashboardLayout';
import BookingTable from '../../components/BookingTable';
import Modal from '../../components/Modal';
import { Alert, EmptyState, Field, Loading, Pagination } from '../../components/ui';
import useFetch from '../../hooks/useFetch';
import { adminApi, getErrorMessage, servicesApi } from '../../services/api';

// Allowed next statuses (the server checks the same rules).
const NEXT = {
  Pending: ['Confirmed', 'Rejected', 'Cancelled'],
  Confirmed: ['Rejected', 'Cancelled'],
  Assigned: ['Accepted', 'Rejected', 'Cancelled'],
  Accepted: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed'],
  Rejected: [],
  Completed: [],
  Cancelled: [],
};
const ASSIGNABLE = ['Pending', 'Confirmed', 'Assigned', 'Rejected'];
const STATUSES = ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

function AssignModal({ booking, onClose, onDone }) {
  const { data, loading, error } = useFetch(() => servicesApi.get(booking.service_id), [booking.service_id]);
  const [providerId, setProviderId] = useState(booking.provider_id || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!providerId) return setSaveError('Choose a provider.');
    setSaving(true);
    try {
      await adminApi.assign(booking.id, Number(providerId));
      onDone();
    } catch (err) {
      setSaveError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Assign provider - booking #${booking.id}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--light" onClick={onClose}>Cancel</button>
          <button type="submit" form="assign-form" className="btn btn--primary" disabled={saving || loading}>{saving ? 'Assigning...' : 'Assign provider'}</button>
        </>
      }
    >
      <form id="assign-form" className="stack" onSubmit={submit}>
        <p style={{ margin: 0 }}>{booking.service?.name} on <strong>{booking.booking_date}</strong> at <strong>{String(booking.booking_time).slice(0, 5)}</strong></p>
        {(error || saveError) && <Alert>{error || saveError}</Alert>}
        {loading ? <Loading /> : (
          <Field label="Provider offering this service" htmlFor="as-provider" hint="Providers who are busy at this time are rejected by the server.">
            <select id="as-provider" className="select" value={providerId} onChange={(e) => { setProviderId(e.target.value); setSaveError(''); }}>
              <option value="">Select a provider</option>
              {data?.providers.map((p) => <option key={p.id} value={p.id}>{p.user.name} - {p.availability_status} - {Number(p.rating).toFixed(1)} stars</option>)}
            </select>
          </Field>
        )}
        {data && data.providers.length === 0 && <Alert type="info">No provider offers this service yet. Add the service to a provider first.</Alert>}
      </form>
    </Modal>
  );
}

function StatusModal({ booking, onClose, onDone }) {
  const options = NEXT[booking.status] || [];
  const [status, setStatus] = useState(options[0] || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.setStatus(booking.id, status);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Update status - booking #${booking.id}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--light" onClick={onClose}>Cancel</button>
          <button type="submit" form="status-form" className="btn btn--primary" disabled={saving || !status}>{saving ? 'Saving...' : 'Update status'}</button>
        </>
      }
    >
      <form id="status-form" className="stack" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <p style={{ margin: 0 }}>Current status: <strong>{booking.status}</strong></p>
        <Field label="Change to" htmlFor="st-status">
          <select id="st-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {options.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </form>
    </Modal>
  );
}

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => adminApi.bookings({ status: statusFilter || undefined, page, limit: 10 }), [statusFilter, page]);
  const [assigning, setAssigning] = useState(null);
  const [changing, setChanging] = useState(null);

  return (
    <>
      <DashHead title="Bookings" subtitle="Assign providers and keep every booking moving." />
      <div className="toolbar">
        <select className="select" aria-label="Filter by status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="small muted" aria-live="polite">{data ? `${data.total} booking${data.total === 1 ? '' : 's'}` : ''}</span>
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}
      {loading && !data && <Loading />}
      {data && data.bookings.length === 0 && <EmptyState icon="clipboard" title="No bookings found" />}

      {data && data.bookings.length > 0 && (
        <div className="card table-card" style={{ opacity: loading ? 0.6 : 1 }}>
          <BookingTable
            bookings={data.bookings}
            viewer="admin"
            renderActions={(b) => (
              <>
                {ASSIGNABLE.includes(b.status) && <button type="button" className="btn btn--primary btn--sm" onClick={() => setAssigning(b)}>{b.provider_id ? 'Reassign' : 'Assign'}</button>}
                {(NEXT[b.status] || []).length > 0 && <button type="button" className="btn btn--light btn--sm" onClick={() => setChanging(b)}>Status</button>}
              </>
            )}
          />
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />

      {assigning && <AssignModal booking={assigning} onClose={() => setAssigning(null)} onDone={() => { setAssigning(null); reload(); }} />}
      {changing && <StatusModal booking={changing} onClose={() => setChanging(null)} onDone={() => { setChanging(null); reload(); }} />}
    </>
  );
}
