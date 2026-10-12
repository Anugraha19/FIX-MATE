// Settings page shared by all roles: change password (PUT /api/users/me/password).
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashHead } from '../../components/DashboardLayout';
import { Alert, Field } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { changePassword, clearUserMessage, selectUserState } from '../../redux/slices/userSlice';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { status, error, message } = useSelector(selectUserState);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    dispatch(clearUserMessage());
  }, [dispatch]);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) return setLocalError('Enter your current password.');
    if (form.newPassword.length < 6) return setLocalError('The new password must be at least 6 characters.');
    if (form.newPassword !== form.confirm) return setLocalError('The new passwords do not match.');
    const result = await dispatch(changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }));
    if (changePassword.fulfilled.match(result)) setForm({ currentPassword: '', newPassword: '', confirm: '' });
  };

  return (
    <>
      <DashHead title="Settings" subtitle="Manage your sign-in details." />
      <div className="stack" style={{ maxWidth: 560, gap: 20 }}>
        <div className="card">
          <h3 className="card__title">Account</h3>
          <dl className="summary-list">
            <dt>Name</dt><dd>{user.name}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Role</dt><dd style={{ textTransform: 'capitalize' }}>{user.role}</dd>
          </dl>
        </div>

        <form className="card stack" onSubmit={submit} noValidate>
          <h3 className="card__title" style={{ marginBottom: 0 }}>Change password</h3>
          {(localError || error) && <Alert>{localError || error}</Alert>}
          {message && !localError && <Alert type="success">{message}</Alert>}
          <Field label="Current password" htmlFor="st-current">
            <input id="st-current" name="currentPassword" type="password" className="input" autoComplete="current-password" value={form.currentPassword} onChange={change} />
          </Field>
          <Field label="New password" htmlFor="st-new">
            <input id="st-new" name="newPassword" type="password" className="input" autoComplete="new-password" value={form.newPassword} onChange={change} />
          </Field>
          <Field label="Confirm new password" htmlFor="st-confirm">
            <input id="st-confirm" name="confirm" type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={change} />
          </Field>
          <div><button type="submit" className="btn btn--primary" disabled={status === 'loading'}>{status === 'loading' ? 'Updating...' : 'Update password'}</button></div>
        </form>
      </div>
    </>
  );
}
