// Profile page shared by customers and providers. Providers also edit their professional details.
// Saving goes through the Redux userSlice (dispatch -> API -> MySQL).
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashHead } from '../../components/DashboardLayout';
import { Alert, Avatar, Field } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { clearUserMessage, saveProfile, selectUserState } from '../../redux/slices/userSlice';
import { isPhone } from '../../utils/format';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { status, error, message } = useSelector(selectUserState);
  const isProvider = user.role === 'provider';
  const provider = user.provider;

  const [values, setValues] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
    experience: provider?.experience ?? 0,
    skills: provider?.skills || '',
    location: provider?.location || '',
    availability_status: provider?.availability_status || 'available',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(clearUserMessage());
  }, [dispatch]);

  const change = (event) => {
    setValues((v) => ({ ...v, [event.target.name]: event.target.value }));
    setErrors((e) => ({ ...e, [event.target.name]: undefined }));
    if (message || error) dispatch(clearUserMessage());
  };

  const submit = (event) => {
    event.preventDefault();
    const found = {};
    if (values.name.trim().length < 2) found.name = 'Enter your name';
    if (!isPhone(values.phone)) found.phone = 'Enter a valid phone number';
    if (isProvider && (Number(values.experience) < 0 || Number(values.experience) > 60)) found.experience = 'Enter 0 to 60 years';
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = { name: values.name.trim(), phone: values.phone.trim(), address: values.address, city: values.city };
    if (isProvider) {
      Object.assign(payload, {
        experience: Number(values.experience),
        skills: values.skills,
        location: values.location,
        availability_status: values.availability_status,
      });
    }
    dispatch(saveProfile({ role: user.role, values: payload }));
  };

  return (
    <>
      <DashHead title="My profile" subtitle="Keep your contact details up to date so bookings run smoothly." />
      <form className="card stack" style={{ maxWidth: 760, gap: 18 }} onSubmit={submit} noValidate>
        <div className="row" style={{ gap: 16 }}>
          <Avatar name={user.name} image={user.profile_image} size={64} />
          <div>
            <strong>{user.name}</strong>
            <div className="muted small">{user.email}</div>
          </div>
        </div>

        {message && <Alert type="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}

        <div className="form-grid">
          <Field label="Full name" htmlFor="pf-name" error={errors.name}>
            <input id="pf-name" name="name" className="input" value={values.name} onChange={change} aria-invalid={Boolean(errors.name)} />
          </Field>
          <Field label="Email" htmlFor="pf-email" hint="Your email is your login and cannot be changed here.">
            <input id="pf-email" className="input" value={user.email} disabled />
          </Field>
          <Field label="Phone" htmlFor="pf-phone" error={errors.phone}>
            <input id="pf-phone" name="phone" type="tel" className="input" value={values.phone} onChange={change} aria-invalid={Boolean(errors.phone)} />
          </Field>
          <Field label="City" htmlFor="pf-city">
            <input id="pf-city" name="city" className="input" value={values.city} onChange={change} />
          </Field>
          <Field label="Address" htmlFor="pf-address" className="full">
            <input id="pf-address" name="address" className="input" value={values.address} onChange={change} />
          </Field>
        </div>

        {isProvider && (
          <>
            <h3 style={{ margin: '8px 0 0' }}>Professional details</h3>
            <div className="form-grid">
              <Field label="Years of experience" htmlFor="pf-experience" error={errors.experience}>
                <input id="pf-experience" name="experience" type="number" min="0" max="60" className="input" value={values.experience} onChange={change} aria-invalid={Boolean(errors.experience)} />
              </Field>
              <Field label="Service area" htmlFor="pf-location">
                <input id="pf-location" name="location" className="input" value={values.location} onChange={change} placeholder="e.g. Kochi" />
              </Field>
              <Field label="Skills" htmlFor="pf-skills" hint="Separate skills with commas." className="full">
                <input id="pf-skills" name="skills" className="input" value={values.skills} onChange={change} placeholder="Pipe fitting, Leak repair, Drain cleaning" />
              </Field>
              <Field label="Availability status" htmlFor="pf-status">
                <select id="pf-status" name="availability_status" className="select" value={values.availability_status} onChange={change}>
                  <option value="available">Available for new jobs</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Not taking bookings</option>
                </select>
              </Field>
            </div>
          </>
        )}

        <div><button type="submit" className="btn btn--primary" disabled={status === 'loading'}>{status === 'loading' ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  );
}
