// Register page - the form state is managed with useReducer because it has many fields plus errors.
// POST /api/auth/register. The server also refuses role "admin", so nobody can register as an admin.
import { useEffect, useReducer } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { dashboardPathFor, isEmail, isPhone } from '../utils/format';

const initialState = {
  values: { name: '', email: '', phone: '', password: '', confirmPassword: '', address: '', city: '', role: 'customer' },
  errors: {},
};

// A reducer takes the current state + an action and returns the NEW state.
function formReducer(state, action) {
  switch (action.type) {
    case 'change':
      return {
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined },
      };
    case 'errors':
      return { ...state, errors: action.errors };
    default:
      return state;
  }
}

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = 'Enter your full name';
  if (!isEmail(v.email)) errors.email = 'Enter a valid email address';
  if (!isPhone(v.phone)) errors.phone = 'Enter a valid phone number (7-15 digits)';
  if (v.password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (v.confirmPassword !== v.password) errors.confirmPassword = 'Passwords do not match';
  if (!v.address.trim()) errors.address = 'Enter your address';
  if (!v.city.trim()) errors.city = 'Enter your city';
  if (!['customer', 'provider'].includes(v.role)) errors.role = 'Choose a role';
  return errors;
}

export default function Register() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { register, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { values, errors } = state;

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) navigate(dashboardPathFor(user.role), { replace: true });
  }, [isAuthenticated, user, navigate]);

  const handleChange = (event) => dispatch({ type: 'change', field: event.target.name, value: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    dispatch({ type: 'errors', errors: found });
    if (Object.keys(found).length) {
      document.getElementById(`reg-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    try {
      const result = await register({ ...values, name: values.name.trim(), email: values.email.trim() });
      navigate(dashboardPathFor(result.user.role), { replace: true });
    } catch {
      // error text comes from Redux
    }
  };

  const input = (name, label, { full, ...props } = {}) => (
    // `full` only controls the grid column, so it is taken out before the rest is spread onto <input>
    <Field label={label} htmlFor={`reg-${name}`} error={errors[name]} className={full ? 'full' : ''}>
      <input
        id={`reg-${name}`}
        name={name}
        className="input"
        value={values[name]}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
        {...props}
      />
    </Field>
  );

  return (
    <form className="glass auth-panel auth-panel--wide" onSubmit={handleSubmit} noValidate aria-labelledby="register-title">
      <h1 id="register-title">Create your account</h1>
      <div className="stack">
        {error && <Alert>{error}</Alert>}
        <div className="form-grid">
          {input('name', 'Full name', { autoComplete: 'name', placeholder: 'Your full name' })}
          {input('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
          {input('phone', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '98470 00000' })}
          <Field label="I want to join as" htmlFor="reg-role" error={errors.role}>
            <select id="reg-role" name="role" className="select" value={values.role} onChange={handleChange}>
              <option value="customer">Customer - book repair services</option>
              <option value="provider">Service provider - get work requests</option>
            </select>
          </Field>
          {input('password', 'Password', { type: 'password', autoComplete: 'new-password', placeholder: 'At least 6 characters' })}
          {input('confirmPassword', 'Confirm password', { type: 'password', autoComplete: 'new-password', placeholder: 'Type the password again' })}
          {input('address', 'Address', { autoComplete: 'street-address', placeholder: 'House / flat, street, area', full: true })}
          {input('city', 'City', { autoComplete: 'address-level2', placeholder: 'Kochi' })}
        </div>
        <div className="auth-actions">
          <div className="auth-links">Already registered? <Link to="/login">Login</Link></div>
          <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
        </div>
      </div>
    </form>
  );
}
