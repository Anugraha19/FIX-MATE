// Admin reports - GET /api/admin/reports (raw SQL on the server) and a streamed CSV export.
import { useMemo, useState } from 'react';
import { DashHead } from '../../components/DashboardLayout';
import Icon from '../../components/Icon';
import { Alert, Loading, StatCard } from '../../components/ui';
import useFetch from '../../hooks/useFetch';
import { adminApi, getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/format';

export default function AdminReports() {
  const { data, loading, error, reload } = useFetch(() => adminApi.reports(), []);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [working, setWorking] = useState('');

  const maxBookings = useMemo(() => Math.max(1, ...(data?.popularity || []).map((p) => p.bookings)), [data]);

  const downloadCsv = async () => {
    setWorking('download');
    setMessage({ type: '', text: '' });
    try {
      const blob = await adminApi.downloadCsv(); // the server streams the file; we save it
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fixmate-bookings.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setWorking('');
    }
  };

  const saveOnServer = async () => {
    setWorking('save');
    try {
      const result = await adminApi.saveReport();
      setMessage({ type: 'success', text: `${result.message}: server/reports/${result.file}` });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setWorking('');
    }
  };

  if (loading) return <Loading text="Building reports..." />;
  if (error) return <Alert onRetry={reload}>{error}</Alert>;

  return (
    <>
      <DashHead title="Reports" subtitle="Revenue, popular services and provider performance.">
        <div className="row">
          <button type="button" className="btn btn--outline" onClick={saveOnServer} disabled={Boolean(working)}>{working === 'save' ? 'Saving...' : 'Save report on server'}</button>
          <button type="button" className="btn btn--primary" onClick={downloadCsv} disabled={Boolean(working)}><Icon name="download" size={18} /> {working === 'download' ? 'Preparing...' : 'Download bookings CSV'}</button>
        </div>
      </DashHead>
      {message.text && <div style={{ marginBottom: 16 }}><Alert type={message.type}>{message.text}</Alert></div>}

      <div className="grid grid--stats">
        <StatCard icon="rupee" label="Revenue from completed jobs" value={formatPrice(data.revenue.completed_revenue)} dark />
        <StatCard icon="clock" label="Value of open bookings" value={formatPrice(data.revenue.pipeline_value)} />
        <StatCard icon="tag" label="Average booking value" value={formatPrice(data.revenue.average_booking_value)} />
      </div>

      <div className="panel-grid">
        <div className="card table-card">
          <h3 style={{ margin: 0, padding: '18px 20px 8px' }}>Monthly bookings and revenue</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Month</th><th>Bookings</th><th>Completed</th><th>Cancelled</th><th>Revenue</th></tr></thead>
              <tbody>
                {data.monthly.map((m) => (
                  <tr key={m.month}>
                    <td data-label="Month">{m.month}</td>
                    <td data-label="Bookings">{m.total_bookings}</td>
                    <td data-label="Completed">{m.completed}</td>
                    <td data-label="Cancelled">{m.cancelled}</td>
                    <td data-label="Revenue">{formatPrice(m.revenue)}</td>
                  </tr>
                ))}
                {data.monthly.length === 0 && <tr><td colSpan="5" className="muted">No bookings yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="card__title">Most booked services</h3>
          <ul className="list-plain">
            {data.popularity.map((p) => (
              <li key={p.id}>
                <div className="row between small"><span>{p.name}</span><strong>{p.bookings}</strong></div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--sand-100)', marginTop: 4 }}>
                  <div style={{ width: `${(p.bookings / maxBookings) * 100}%`, height: '100%', borderRadius: 4, background: 'var(--forest)' }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card table-card" style={{ marginTop: 20 }}>
        <h3 style={{ margin: 0, padding: '18px 20px 8px' }}>Provider performance</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Provider</th><th>Completed jobs</th><th>Earnings</th></tr></thead>
            <tbody>
              {data.providerJobs.map((p) => (
                <tr key={p.id}>
                  <td data-label="Provider">{p.name}</td>
                  <td data-label="Completed jobs">{p.completed_jobs}</td>
                  <td data-label="Earnings">{formatPrice(p.earnings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
