// Admin: customers. Search, edit, disable/enable and delete (GET/PUT/DELETE /api/admin/users).
import { useState } from 'react';
import { DashHead } from '../../components/DashboardLayout';
import Icon from '../../components/Icon';
import Modal, { ConfirmModal } from '../../components/Modal';
import { Alert, EmptyState, Field, Loading, Pagination } from '../../components/ui';
import useDebounce from '../../hooks/useDebounce';
import useFetch from '../../hooks/useFetch';
import { adminApi, getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';

function EditUserModal({ user, onClose, onSaved }) {
  const [values, setValues] = useState({ name: user.name, phone: user.phone, address: user.address || '', city: user.city || '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateUser(user.id, values);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Edit ${user.name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--light" onClick={onClose}>Cancel</button>
          <button type="submit" form="edit-user" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
        </>
      }
    >
      <form id="edit-user" className="form-grid" onSubmit={submit}>
        {error && <div className="full"><Alert>{error}</Alert></div>}
        <Field label="Name" htmlFor="eu-name"><input id="eu-name" name="name" className="input" value={values.name} onChange={change} required /></Field>
        <Field label="Phone" htmlFor="eu-phone"><input id="eu-phone" name="phone" className="input" value={values.phone} onChange={change} required /></Field>
        <Field label="City" htmlFor="eu-city"><input id="eu-city" name="city" className="input" value={values.city} onChange={change} /></Field>
        <Field label="Address" htmlFor="eu-address"><input id="eu-address" name="address" className="input" value={values.address} onChange={change} /></Field>
      </form>
    </Modal>
  );
}

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 400);
  const { data, loading, error, reload } = useFetch(() => adminApi.users({ q: debouncedQ || undefined, page, limit: 10 }), [debouncedQ, page]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleActive = async (user) => {
    setActionError('');
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    setActionError('');
    try {
      await adminApi.removeUser(deleting.id, true);
      setDeleting(null);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DashHead title="Customers" subtitle="Search, edit and manage customer accounts." />
      <div className="toolbar">
        <div className="input-wrap">
          <Icon name="search" size={18} />
          <input className="input" type="search" placeholder="Search name, email or phone" aria-label="Search customers" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <span className="small muted" aria-live="polite">{data ? `${data.total} customer${data.total === 1 ? '' : 's'}` : ''}</span>
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}
      {actionError && <div style={{ marginBottom: 12 }}><Alert>{actionError}</Alert></div>}
      {loading && !data && <Loading />}
      {data && data.users.length === 0 && <EmptyState icon="users" title="No customers found" message="Try a different search." />}

      {data && data.users.length > 0 && (
        <div className="card table-card" style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Customer</th><th>Phone</th><th>City</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td data-label="Customer"><span className="cell-main">{u.name}</span><span className="cell-sub">{u.email}</span></td>
                    <td data-label="Phone">{u.phone}</td>
                    <td data-label="City">{u.city || '-'}</td>
                    <td data-label="Joined">{formatDate(u.createdAt)}</td>
                    <td data-label="Status"><span className={`badge ${u.is_active ? 'badge--active' : 'badge--disabled'}`}>{u.is_active ? 'Active' : 'Disabled'}</span></td>
                    <td className="cell-actions">
                      <div className="actions">
                        <button type="button" className="btn btn--light btn--sm" onClick={() => setEditing(u)}>Edit</button>
                        <button type="button" className="btn btn--outline btn--sm" onClick={() => toggleActive(u)}>{u.is_active ? 'Disable' : 'Enable'}</button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(u)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />

      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {deleting && (
        <ConfirmModal
          title="Delete this customer?"
          message={`${deleting.name} will be removed permanently. If they already have bookings, disable the account instead.`}
          confirmLabel="Delete customer"
          danger
          busy={busy}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
