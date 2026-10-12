// Admin: service providers. Add, view, edit, deactivate and delete (GET/POST/PUT/DELETE /api/admin/providers).
import { useState } from 'react';
import { DashHead } from '../../components/DashboardLayout';
import Icon from '../../components/Icon';
import Modal, { ConfirmModal } from '../../components/Modal';
import { Alert, EmptyState, Field, Loading, Pagination, Stars } from '../../components/ui';
import useDebounce from '../../hooks/useDebounce';
import useFetch from '../../hooks/useFetch';
import { adminApi, getErrorMessage, servicesApi } from '../../services/api';

// Add / edit form in a modal. `provider` is null when adding.
function ProviderModal({ provider, services, onClose, onSaved }) {
  const editing = Boolean(provider);
  const [values, setValues] = useState({
    name: provider?.user.name || '',
    email: provider?.user.email || '',
    phone: provider?.user.phone || '',
    password: '',
    city: provider?.user.city || '',
    address: provider?.user.address || '',
    experience: provider?.experience ?? 0,
    skills: provider?.skills || '',
    location: provider?.location || '',
    availability_status: provider?.availability_status || 'available',
  });
  const [serviceIds, setServiceIds] = useState(provider ? provider.services.map((s) => s.id) : []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value });
  const toggle = (id) => setServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!editing && values.password.length < 6) return setError('Password must be at least 6 characters.');
    setSaving(true);
    try {
      if (editing) {
        const { name, phone, city, address, experience, skills, location, availability_status } = values;
        await adminApi.updateProvider(provider.id, { name, phone, city, address, experience: Number(experience), skills, location, availability_status, service_ids: serviceIds });
      } else {
        await adminApi.createProvider({ ...values, experience: Number(values.experience), service_ids: serviceIds });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={editing ? `Edit ${provider.user.name}` : 'Add a service provider'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--light" onClick={onClose}>Cancel</button>
          <button type="submit" form="provider-form" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add provider'}</button>
        </>
      }
    >
      <form id="provider-form" className="stack" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <div className="form-grid">
          <Field label="Name" htmlFor="pm-name"><input id="pm-name" name="name" className="input" value={values.name} onChange={change} required /></Field>
          <Field label="Email" htmlFor="pm-email"><input id="pm-email" name="email" type="email" className="input" value={values.email} onChange={change} disabled={editing} required /></Field>
          <Field label="Phone" htmlFor="pm-phone"><input id="pm-phone" name="phone" className="input" value={values.phone} onChange={change} required /></Field>
          {!editing && <Field label="Temporary password" htmlFor="pm-password"><input id="pm-password" name="password" type="password" className="input" value={values.password} onChange={change} autoComplete="new-password" required /></Field>}
          <Field label="City" htmlFor="pm-city"><input id="pm-city" name="city" className="input" value={values.city} onChange={change} /></Field>
          <Field label="Service area" htmlFor="pm-location"><input id="pm-location" name="location" className="input" value={values.location} onChange={change} /></Field>
          <Field label="Address" htmlFor="pm-address" className="full"><input id="pm-address" name="address" className="input" value={values.address} onChange={change} /></Field>
          <Field label="Experience (years)" htmlFor="pm-exp"><input id="pm-exp" name="experience" type="number" min="0" max="60" className="input" value={values.experience} onChange={change} /></Field>
          {editing && (
            <Field label="Availability" htmlFor="pm-status">
              <select id="pm-status" name="availability_status" className="select" value={values.availability_status} onChange={change}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </Field>
          )}
          <Field label="Skills" htmlFor="pm-skills" hint="Separate with commas" className="full"><input id="pm-skills" name="skills" className="input" value={values.skills} onChange={change} /></Field>
        </div>
        <div>
          <strong>Services offered</strong>
          <div className="checkbox-grid" style={{ marginTop: 8 }}>
            {services.map((s) => (
              <label className="check" key={s.id}>
                <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggle(s.id)} />
                <span className="small">{s.name}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminProviders() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 400);
  const { data, loading, error, reload } = useFetch(() => adminApi.providers({ q: debouncedQ || undefined, page, limit: 10 }), [debouncedQ, page]);
  const servicesState = useFetch(() => servicesApi.list({ limit: 50 }), []);
  const [modal, setModal] = useState(null); // { provider } for edit, {} for add
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleActive = async (p) => {
    setActionError('');
    try {
      if (p.user.is_active) await adminApi.removeProvider(p.id); // deactivate
      else await adminApi.updateProvider(p.id, { is_active: true, availability_status: 'available' }); // reactivate
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    setActionError('');
    try {
      await adminApi.removeProvider(deleting.id, true);
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
      <DashHead title="Service providers" subtitle="Add providers and manage their profiles and services.">
        <button type="button" className="btn btn--primary" onClick={() => setModal({})} disabled={!servicesState.data}><Icon name="plus" size={18} /> Add provider</button>
      </DashHead>

      <div className="toolbar">
        <div className="input-wrap">
          <Icon name="search" size={18} />
          <input className="input" type="search" placeholder="Search name or email" aria-label="Search providers" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <span className="small muted" aria-live="polite">{data ? `${data.total} provider${data.total === 1 ? '' : 's'}` : ''}</span>
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}
      {actionError && <div style={{ marginBottom: 12 }}><Alert>{actionError}</Alert></div>}
      {loading && !data && <Loading />}
      {data && data.providers.length === 0 && <EmptyState icon="briefcase" title="No providers found" />}

      {data && data.providers.length > 0 && (
        <div className="card table-card" style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Provider</th><th>Services</th><th>Experience</th><th>Rating</th><th>Jobs done</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.providers.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Provider"><span className="cell-main">{p.user.name}</span><span className="cell-sub">{p.user.email} - {p.location || p.user.city}</span></td>
                    <td data-label="Services">{p.services.length ? p.services.map((s) => s.name).join(', ') : <span className="muted">None</span>}</td>
                    <td data-label="Experience">{p.experience} yr</td>
                    <td data-label="Rating"><Stars value={p.rating} size={13} showValue /></td>
                    <td data-label="Jobs done">{p.completed_jobs}</td>
                    <td data-label="Status"><span className={`badge ${p.user.is_active ? 'badge--active' : 'badge--disabled'}`}>{p.user.is_active ? p.availability_status : 'Deactivated'}</span></td>
                    <td className="cell-actions">
                      <div className="actions">
                        <button type="button" className="btn btn--light btn--sm" onClick={() => setModal({ provider: p })}>Edit</button>
                        <button type="button" className="btn btn--outline btn--sm" onClick={() => toggleActive(p)}>{p.user.is_active ? 'Deactivate' : 'Activate'}</button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(p)}>Delete</button>
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

      {modal && servicesState.data && (
        <ProviderModal
          provider={modal.provider}
          services={servicesState.data.services}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Delete this provider?"
          message={`${deleting.user.name}'s account and profile will be removed permanently. Their past bookings stay but become unassigned. To keep the history, deactivate instead.`}
          confirmLabel="Delete provider"
          danger
          busy={busy}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
