// Booking page - the customer picks service, provider, date and time, and the booking is saved in MySQL.
// The form state uses useReducer; the estimated cost uses useMemo; the error box uses useRef to scroll into view.
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Field, Loading } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { configApi, providersApi, servicesApi, getErrorMessage } from '../services/api';
import { createBooking, selectDraft } from '../redux/slices/bookingSlice';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDuration, formatPrice, formatTime, todayISO } from '../utils/format';

function reducer(state, action) {
  switch (action.type) {
    case 'change': {
      const values = { ...state.values, [action.field]: action.value };
      if (action.field === 'service_id') values.provider_id = ''; // a new service means the provider list changes
      return { ...state, values, errors: { ...state.errors, [action.field]: undefined }, serverError: '' };
    }
    case 'errors':
      return { ...state, errors: action.errors };
    case 'serverError':
      return { ...state, serverError: action.message };
    default:
      return state;
  }
}

function validate(v, slots) {
  const errors = {};
  if (!v.service_id) errors.service_id = 'Choose a service';
  if (!v.booking_date) errors.booking_date = 'Choose a date';
  else if (v.booking_date < todayISO()) errors.booking_date = 'The date cannot be in the past';
  if (!v.booking_time) errors.booking_time = 'Choose a time';
  else if (slots && !slots.includes(v.booking_time)) errors.booking_time = 'Choose one of the listed times';
  if (!v.address.trim()) errors.address = 'Enter the address for the visit';
  if (v.problem_description.trim().length < 5) errors.problem_description = 'Describe the problem (at least 5 characters)';
  return errors;
}

export default function Booking() {
  const dispatchRedux = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const draft = useSelector(selectDraft);
  const [searchParams] = useSearchParams();
  const errorRef = useRef(null);

  const [state, dispatch] = useReducer(reducer, null, () => ({
    values: {
      service_id: draft.service_id || searchParams.get('service') || '',
      provider_id: draft.provider_id || '',
      booking_date: '',
      booking_time: '',
      address: [user?.address, user?.city].filter(Boolean).join(', '),
      problem_description: '',
      notes: '',
    },
    errors: {},
    serverError: '',
    submitting: false,
  }));
  const { values, errors, serverError } = state;

  // data from the API
  const servicesState = useFetch(() => servicesApi.list({ limit: 50 }), []);
  const configState = useFetch(() => configApi.booking(), []);
  const detailState = useFetch(() => servicesApi.get(values.service_id), [values.service_id], { skip: !values.service_id });
  const providerState = useFetch(() => providersApi.get(values.provider_id), [values.provider_id], { skip: !values.provider_id });

  const service = detailState.data?.service;
  const providers = detailState.data?.providers || [];
  const slots = configState.data?.slots?.map((s) => (s.length === 5 ? s : s.slice(0, 5)));

  // useMemo: recalculate only when the chosen service changes
  const estimate = useMemo(() => (service ? Number(service.price) : 0), [service]);

  const chosenProvider = providers.find((p) => String(p.id) === String(values.provider_id));

  useEffect(() => {
    if (serverError) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [serverError]);

  const change = (event) => dispatch({ type: 'change', field: event.target.name, value: event.target.value });

  // hide time slots that already passed today
  const slotDisabled = (slot) => {
    if (values.booking_date !== todayISO()) return false;
    return Number(slot.split(':')[0]) <= new Date().getHours();
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate(values, slots);
    dispatch({ type: 'errors', errors: found });
    if (Object.keys(found).length) {
      document.getElementById(`bk-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    try {
      await dispatchRedux(
        createBooking({
          ...values,
          service_id: Number(values.service_id),
          provider_id: values.provider_id ? Number(values.provider_id) : null,
        })
      ).unwrap();
      navigate('/booking/confirmation');
    } catch (message) {
      dispatch({ type: 'serverError', message: typeof message === 'string' ? message : getErrorMessage(message) });
    }
  };

  if (servicesState.loading || configState.loading) return <Loading text="Preparing your booking..." />;
  if (servicesState.error || configState.error) {
    return (
      <div className="container page-body">
        <Alert onRetry={() => { servicesState.reload(); configState.reload(); }}>{servicesState.error || configState.error}</Alert>
      </div>
    );
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Book a service</h1>
          <p>Tell us what needs fixing and when. Your provider will confirm the booking.</p>
        </div>
      </section>

      <div className="container page-body">
        <div className="detail-grid">
          <form id="booking-form" className="card stack" onSubmit={submit} noValidate style={{ gap: 18 }}>
            <div ref={errorRef}>{serverError && <Alert>{serverError}</Alert>}</div>

            <div className="form-grid">
              <Field label="Service" htmlFor="bk-service_id" error={errors.service_id}>
                <select id="bk-service_id" name="service_id" className="select" value={values.service_id} onChange={change} aria-invalid={Boolean(errors.service_id)}>
                  <option value="">Select a service</option>
                  {servicesState.data.services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - from {formatPrice(s.price)}</option>
                  ))}
                </select>
              </Field>

              <Field label="Provider" htmlFor="bk-provider_id" hint={values.service_id ? 'Leave it on "Any provider" and we will assign one for you.' : 'Choose a service first.'}>
                <select id="bk-provider_id" name="provider_id" className="select" value={values.provider_id} onChange={change} disabled={!values.service_id || detailState.loading}>
                  <option value="">Any available provider</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.availability_status === 'unavailable'}>
                      {p.user.name} - {Number(p.rating) > 0 ? `${Number(p.rating).toFixed(1)} stars` : 'new'} ({p.availability_status})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date" htmlFor="bk-booking_date" error={errors.booking_date}>
                <input id="bk-booking_date" name="booking_date" type="date" className="input" min={todayISO()} max={todayISO(configState.data.maxDaysAhead)} value={values.booking_date} onChange={change} aria-invalid={Boolean(errors.booking_date)} />
              </Field>

              <Field label="Time" htmlFor="bk-booking_time" error={errors.booking_time}>
                <select id="bk-booking_time" name="booking_time" className="select" value={values.booking_time} onChange={change} aria-invalid={Boolean(errors.booking_time)}>
                  <option value="">Select a time</option>
                  {slots.map((slot) => (
                    <option key={slot} value={slot} disabled={slotDisabled(slot)}>{formatTime(slot)}</option>
                  ))}
                </select>
              </Field>
            </div>

            {values.provider_id && providerState.data?.availability?.length > 0 && (
              <div className="alert alert--info">
                <strong>{chosenProvider?.user.name || 'This provider'} is free on:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {providerState.data.availability.slice(0, 5).map((slot) => (
                    <li key={slot.id}>{formatDate(slot.available_date)}, {formatTime(slot.start_time)} - {formatTime(slot.end_time)}</li>
                  ))}
                </ul>
              </div>
            )}

            <Field label="Address for the visit" htmlFor="bk-address" error={errors.address}>
              <input id="bk-address" name="address" className="input" placeholder="House / flat, street, area, city" value={values.address} onChange={change} aria-invalid={Boolean(errors.address)} autoComplete="street-address" />
            </Field>

            <Field label="Describe the problem" htmlFor="bk-problem_description" error={errors.problem_description}>
              <textarea id="bk-problem_description" name="problem_description" className="textarea" placeholder="What is wrong? When did it start?" value={values.problem_description} onChange={change} aria-invalid={Boolean(errors.problem_description)} />
            </Field>

            <Field label="Notes for the provider (optional)" htmlFor="bk-notes">
              <textarea id="bk-notes" name="notes" className="textarea" style={{ minHeight: 70 }} placeholder="Gate code, parking, best phone number..." value={values.notes} onChange={change} />
            </Field>
          </form>

          <aside className="card sticky-card">
            <h3>Booking summary</h3>
            {!service ? (
              <p className="muted">Choose a service to see the estimated cost.</p>
            ) : (
              <dl className="summary-list">
                <dt>Service</dt><dd>{service.name}</dd>
                <dt>Duration</dt><dd>{formatDuration(service.duration)}</dd>
                <dt>Provider</dt><dd>{chosenProvider?.user.name || 'We will assign one'}</dd>
                <dt>Date</dt><dd>{values.booking_date ? formatDate(values.booking_date) : '-'}</dd>
                <dt>Time</dt><dd>{values.booking_time ? formatTime(values.booking_time) : '-'}</dd>
              </dl>
            )}
            <div className="facts" style={{ gridTemplateColumns: '1fr' }}>
              <div className="fact">
                <span>Estimated cost</span>
                <strong style={{ fontSize: '1.4rem' }}>{formatPrice(estimate)}</strong>
              </div>
            </div>
            <p className="small muted">Your provider confirms the final price after seeing the problem. You pay only after the job is done.</p>
            <button type="submit" form="booking-form" className="btn btn--primary btn--block" disabled={state.submitting}>Confirm Booking</button>
            <p className="small center" style={{ margin: '12px 0 0' }}><Link to="/services">Browse more services</Link></p>
          </aside>
        </div>
      </div>
    </>
  );
}
