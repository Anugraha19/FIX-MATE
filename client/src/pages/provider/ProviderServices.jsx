// Provider "My services": tick the services you offer. Saved with PUT /api/providers/me { service_ids } (provider_services table).
import { useEffect, useState } from 'react';
import { DashHead } from '../../components/DashboardLayout';
import { Alert, Loading } from '../../components/ui';
import useFetch from '../../hooks/useFetch';
import { getErrorMessage, providersApi, servicesApi } from '../../services/api';
import { formatPrice } from '../../utils/format';

export default function ProviderServices() {
  const services = useFetch(() => servicesApi.list({ limit: 50 }), []);
  const mine = useFetch(() => providersApi.me(), []);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mine.data) setSelected(mine.data.provider.services.map((s) => s.id));
  }, [mine.data]);

  const toggle = (id) => {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
    setMessage({ type: '', text: '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      await providersApi.update('me', { service_ids: selected });
      setMessage({ type: 'success', text: 'Your services were saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  if (services.loading || mine.loading) return <Loading />;
  if (services.error || mine.error) return <Alert onRetry={() => { services.reload(); mine.reload(); }}>{services.error || mine.error}</Alert>;

  return (
    <>
      <DashHead title="My services" subtitle="Customers can only book you for the services you tick here." />
      {message.text && <div style={{ marginBottom: 16 }}><Alert type={message.type}>{message.text}</Alert></div>}
      <div className="checkbox-grid">
        {services.data.services.map((s) => (
          <label className="check" key={s.id}>
            <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
            <span>
              <strong style={{ display: 'block' }}>{s.name}</strong>
              <span className="small muted">{s.category?.name} - {formatPrice(s.price)}</span>
            </span>
          </label>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : `Save ${selected.length} service${selected.length === 1 ? '' : 's'}`}</button>
      </div>
    </>
  );
}
