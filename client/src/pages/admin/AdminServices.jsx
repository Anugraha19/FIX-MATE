// Admin: services - full CRUD (POST/PUT/DELETE /api/services). Also shows inactive services.
import { useState } from 'react';
import { DashHead } from '../../components/DashboardLayout';
import Icon, { iconFor } from '../../components/Icon';
import Modal, { ConfirmModal } from '../../components/Modal';
import { Alert, EmptyState, Field, Loading, Pagination } from '../../components/ui';
import useDebounce from '../../hooks/useDebounce';
import useFetch from '../../hooks/useFetch';
import { adminApi, categoriesApi, getErrorMessage, servicesApi } from '../../services/api';
import { formatDuration, formatPrice } from '../../utils/format';

export const ICON_KEYS = ['wrench', 'tap', 'shower', 'drain', 'bolt', 'bulb', 'plug', 'hammer', 'door', 'roller', 'washer', 'fridge', 'snowflake', 'sparkle', 'brick', 'home'];

function ServiceModal({ service, categories, onClose, onSaved }) {
  const editing = Boolean(service);
  const [values, setValues] = useState({
    category_id: service?.category_id || categories[0]?.id || '',
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || '',
    duration: service?.duration || 60,
    image: service?.image || 'wrench',
    is_active: service ? service.is_active : true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (e) => setValues({ ...values, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!values.name.trim()) return setError('Enter a service name.');
    if (!(Number(values.price) > 0)) return setError('Price must be greater than 0.');
    if (Number(values.duration) < 15) return setError('Duration must be at least 15 minutes.');
    setSaving(true);
    const body = { ...values, category_id: Number(values.category_id), price: Number(values.price), duration: Number(values.duration) };
    try {
      if (editing) await servicesApi.update(service.id, body);
      else await servicesApi.create(body);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Edit service' : 'Add a service'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--light" onClick={onClose}>Cancel</button>
          <button type="submit" form="service-form" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save service'}</button>
        </>
      }
    >
      <form id="service-form" className="form-grid" onSubmit={submit} noValidate>
        {error && <div className="full"><Alert>{error}</Alert></div>}
        <Field label="Service name" htmlFor="sv-name" className="full"><input id="sv-name" name="name" className="input" value={values.name} onChange={change} /></Field>
        <Field label="Category" htmlFor="sv-cat">
          <select id="sv-cat" name="category_id" className="select" value={values.category_id} onChange={change}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Icon" htmlFor="sv-icon">
          <select id="sv-icon" name="image" className="select" value={values.image} onChange={change}>
            {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Starting price (INR)" htmlFor="sv-price"><input id="sv-price" name="price" type="number" min="1" className="input" value={values.price} onChange={change} /></Field>
        <Field label="Duration (minutes)" htmlFor="sv-duration"><input id="sv-duration" name="duration" type="number" min="15" step="15" className="input" value={values.duration} onChange={change} /></Field>
        <Field label="Description" htmlFor="sv-desc" className="full"><textarea id="sv-desc" name="description" className="textarea" value={values.description} onChange={change} /></Field>
        <label className="check full"><input type="checkbox" name="is_active" checked={values.is_active} onChange={change} /> Visible to customers</label>
      </form>
    </Modal>
  );
}

export default function AdminServices() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 400);
  const categoriesState = useFetch(() => categoriesApi.list(), []);
  const { data, loading, error, reload } = useFetch(
    () => adminApi.services({ q: debouncedQ || undefined, category: category || undefined, page, limit: 10 }),
    [debouncedQ, category, page]
  );
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const categories = categoriesState.data?.categories || [];

  const confirmDelete = async () => {
    setBusy(true);
    setActionError('');
    try {
      await servicesApi.remove(deleting.id);
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
      <DashHead title="Services" subtitle="Create, update and remove the services customers can book.">
        <button type="button" className="btn btn--primary" onClick={() => setModal({})} disabled={categories.length === 0}><Icon name="plus" size={18} /> Add service</button>
      </DashHead>

      <div className="toolbar">
        <div className="input-wrap">
          <Icon name="search" size={18} />
          <input className="input" type="search" placeholder="Search services" aria-label="Search services" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <select className="select" aria-label="Filter by category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}
      {actionError && <div style={{ marginBottom: 12 }}><Alert>{actionError}</Alert></div>}
      {loading && !data && <Loading />}
      {data && data.services.length === 0 && <EmptyState icon="tools" title="No services found" />}

      {data && data.services.length > 0 && (
        <div className="card table-card" style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Service</th><th>Category</th><th>Price</th><th>Duration</th><th>Providers</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.services.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Service"><span className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><span className="icon-tile" style={{ width: 36, height: 36, borderRadius: 10 }}><Icon name={iconFor(s.image)} size={18} /></span><span className="cell-main">{s.name}</span></span></td>
                    <td data-label="Category">{s.category?.name}</td>
                    <td data-label="Price">{formatPrice(s.price)}</td>
                    <td data-label="Duration">{formatDuration(s.duration)}</td>
                    <td data-label="Providers">{s.provider_count}</td>
                    <td data-label="Status"><span className={`badge ${s.is_active ? 'badge--active' : 'badge--disabled'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="cell-actions">
                      <div className="actions">
                        <button type="button" className="btn btn--light btn--sm" onClick={() => setModal({ service: s })}>Edit</button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(s)}>Delete</button>
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

      {modal && <ServiceModal service={modal.service} categories={categories} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {deleting && (
        <ConfirmModal
          title="Delete this service?"
          message={`"${deleting.name}" will be removed. A service that already has bookings cannot be deleted. Set it to inactive instead.`}
          confirmLabel="Delete service"
          danger
          busy={busy}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
