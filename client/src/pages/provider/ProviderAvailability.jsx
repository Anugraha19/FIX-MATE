// Provider availability: set the overall status and add/remove date windows (GET/POST/DELETE /api/providers/me/availability).
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DashHead } from '../../components/DashboardLayout';
import { Alert, EmptyState, Field, Loading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import useFetch from '../../hooks/useFetch';
import { getErrorMessage, providersApi } from '../../services/api';
import { saveProfile } from '../../redux/slices/userSlice';
import { formatDate, formatTime, todayISO } from '../../utils/format';

export default function ProviderAvailability() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => providersApi.myAvailability(), []);
  const [form, setForm] = useState({ available_date: todayISO(1), start_time: '09:00', end_time: '17:00', is_available: 'true' });
  const [formError, setFormError] = useState('');
  const [info, setInfo] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const addSlot = async (e) => {
    e.preventDefault();
    if (!form.available_date || !form.start_time || !form.end_time) return setFormError('Choose a date, start time and end time.');
    if (form.end_time <= form.start_time) return setFormError('The end time must be after the start time.');
    setSaving(true);
    try {
      await providersApi.addAvailability({ ...form, is_available: form.is_available === 'true' });
      setInfo('Time window added.');
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeSlot = async (slot) => {
    try {
      await providersApi.removeAvailability(slot.id);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const setStatus = async (e) => {
    const result = await dispatch(saveProfile({ role: 'provider', values: { availability_status: e.target.value } }));
    setInfo(result.error ? '' : 'Status updated.');
    if (result.error) setFormError(result.payload);
  };

  return (
    <>
      <DashHead title="Availability" subtitle="Customers can only book you in the times you allow." />
      <div className="panel-grid" style={{ marginTop: 0 }}>
        <div className="stack" style={{ gap: 20 }}>
          <div className="card">
            <h3 className="card__title">Current status</h3>
            <Field label="Are you taking new jobs?" htmlFor="av-status">
              <select id="av-status" className="select" value={user.provider?.availability_status || 'available'} onChange={setStatus}>
                <option value="available">Available for new jobs</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Not taking bookings</option>
              </select>
            </Field>
          </div>

          <div className="card">
            <h3 className="card__title">Your time windows</h3>
            {loading && <Loading />}
            {error && <Alert onRetry={reload}>{error}</Alert>}
            {data && data.availability.length === 0 && (
              <EmptyState icon="calendar" title="No time windows yet" message="If you add none, customers can book any standard slot and you confirm each request yourself." />
            )}
            <div className="slot-list">
              {data?.availability.map((slot) => (
                <div className="slot" key={slot.id}>
                  <div>
                    <strong>{formatDate(slot.available_date)}</strong>
                    <div className="small muted">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</div>
                  </div>
                  <div className="row">
                    <span className={`badge ${slot.is_available ? 'badge--active' : 'badge--cancelled'}`}>{slot.is_available ? 'Available' : 'Blocked'}</span>
                    <button type="button" className="btn btn--light btn--sm" onClick={() => removeSlot(slot)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form className="card stack" onSubmit={addSlot} noValidate>
          <h3 className="card__title" style={{ marginBottom: 0 }}>Add a time window</h3>
          {formError && <Alert>{formError}</Alert>}
          {info && !formError && <Alert type="success">{info}</Alert>}
          <Field label="Date" htmlFor="av-date"><input id="av-date" name="available_date" type="date" min={todayISO()} className="input" value={form.available_date} onChange={change} /></Field>
          <div className="form-grid">
            <Field label="From" htmlFor="av-start"><input id="av-start" name="start_time" type="time" className="input" value={form.start_time} onChange={change} /></Field>
            <Field label="To" htmlFor="av-end"><input id="av-end" name="end_time" type="time" className="input" value={form.end_time} onChange={change} /></Field>
          </div>
          <Field label="Type" htmlFor="av-type">
            <select id="av-type" name="is_available" className="select" value={form.is_available} onChange={change}>
              <option value="true">I am available</option>
              <option value="false">Block this time (not available)</option>
            </select>
          </Field>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Adding...' : 'Add window'}</button>
        </form>
      </div>
    </>
  );
}
