// Admin: categories - full CRUD (GET/POST/PUT/DELETE /api/categories).
import { useState } from 'react';
import { DashHead } from '../../components/DashboardLayout';
import Icon, { iconFor } from '../../components/Icon';
import Modal, { ConfirmModal } from '../../components/Modal';
import { Alert, EmptyState, Field, Loading } from '../../components/ui';
import useFetch from '../../hooks/useFetch';
import { categoriesApi, getErrorMessage } from '../../services/api';
import { ICON_KEYS } from './AdminServices';

function CategoryModal({ category, onClose, onSaved }) {
  const editing = Boolean(category);
  const [values, setValues] = useState({ name: category?.name || '', description: category?.description || '', image: category?.image || 'wrench' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!values.name.trim()) return setError('Enter a category name.');
    setSaving(true);
    try {
      if (editing) await categoriesApi.update(category.id, values);
      else await categoriesApi.create(values);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Edit category' : 'Add a category'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--light" onClick={onClose}>Cancel</button>
          <button type="submit" form="category-form" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save category'}</button>
        </>
      }
    >
      <form id="category-form" className="stack" onSubmit={submit} noValidate>
        {error && <Alert>{error}</Alert>}
        <Field label="Name" htmlFor="ct-name"><input id="ct-name" name="name" className="input" value={values.name} onChange={change} /></Field>
        <Field label="Icon" htmlFor="ct-icon">
          <select id="ct-icon" name="image" className="select" value={values.image} onChange={change}>
            {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Description" htmlFor="ct-desc"><textarea id="ct-desc" name="description" className="textarea" value={values.description} onChange={change} /></Field>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  const { data, loading, error, reload } = useFetch(() => categoriesApi.list(), []);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    setBusy(true);
    setActionError('');
    try {
      await categoriesApi.remove(deleting.id);
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
      <DashHead title="Categories" subtitle="Group services so customers can find them quickly.">
        <button type="button" className="btn btn--primary" onClick={() => setModal({})}><Icon name="plus" size={18} /> Add category</button>
      </DashHead>
      {error && <Alert onRetry={reload}>{error}</Alert>}
      {actionError && <div style={{ marginBottom: 12 }}><Alert>{actionError}</Alert></div>}
      {loading && !data && <Loading />}
      {data && data.categories.length === 0 && <EmptyState icon="layers" title="No categories yet" />}

      <div className="grid grid--cards">
        {data?.categories.map((c) => (
          <div className="card stack" key={c.id} style={{ gap: 10 }}>
            <div className="row between">
              <span className="icon-tile"><Icon name={iconFor(c.image)} size={26} /></span>
              <span className="tag">{c.service_count} active service{c.service_count === 1 ? '' : 's'}</span>
            </div>
            <h3 style={{ margin: 0 }}>{c.name}</h3>
            <p className="muted small" style={{ margin: 0 }}>{c.description || 'No description'}</p>
            <div className="row" style={{ marginTop: 'auto' }}>
              <button type="button" className="btn btn--light btn--sm" onClick={() => setModal({ category: c })}>Edit</button>
              <button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(c)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modal && <CategoryModal category={modal.category} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {deleting && (
        <ConfirmModal
          title="Delete this category?"
          message={`"${deleting.name}" will be removed. Categories that still have services cannot be deleted.`}
          confirmLabel="Delete category"
          danger
          busy={busy}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
