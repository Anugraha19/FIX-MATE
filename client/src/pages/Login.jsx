// Login page - recreated from the Figma design.
// Email OR phone + password go to POST /api/auth/login. The Google / Facebook / X buttons are UI only (no OAuth set up).
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert } from '../components/ui';
import { FacebookIcon, GoogleIcon, XIcon } from '../components/SocialIcons';
import { useAuth } from '../context/AuthContext';
import { dashboardPathFor, isEmail, isPhone } from '../utils/format';

export default function Login() {
  const { login, loading, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef(null); // useRef: focus the first field when the page opens

  const [form, setForm] = useState({ email: '', phone: '', password: '' });
  const [fieldError, setFieldError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    emailRef.current?.focus();
    clearError();
  }, [clearError]);

  // already logged in? go straight to the right dashboard
  useEffect(() => {
    if (isAuthenticated) navigate(location.state?.from || dashboardPathFor(user.role), { replace: true });
  }, [isAuthenticated, user, navigate, location.state]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!email && !phone) return setFieldError('Enter your email or your phone number.');
    if (email && !isEmail(email)) return setFieldError('Enter a valid email address.');
    if (!email && !isPhone(phone)) return setFieldError('Enter a valid phone number.');
    if (!form.password) return setFieldError('Enter your password.');

    try {
      const body = email ? { email, password: form.password } : { phone, password: form.password };
      const result = await login(body);
      navigate(location.state?.from || dashboardPathFor(result.user.role), { replace: true });
    } catch {
      // the error message is already stored in Redux and shown below
    }
  };

  const socialClick = (provider) => setNotice(`Login with ${provider} is not connected in this version. Please use your email or phone number.`);

  return (
    <form className="glass auth-panel" onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
      <h1 id="login-title">Login</h1>
      <div className="stack">
        {(fieldError || error) && <Alert>{fieldError || error}</Alert>}
        {notice && <Alert type="info">{notice}</Alert>}

        <div className="input-wrap">
          <Icon name="mail" size={22} />
          <input ref={emailRef} className="input" type="email" name="email" placeholder="Enter email Id" aria-label="Email" autoComplete="email" value={form.email} onChange={handleChange} />
        </div>
        <p className="auth-or" aria-hidden="true">OR</p>
        <div className="input-wrap">
          <Icon name="phone" size={22} />
          <input className="input" type="tel" name="phone" placeholder="Enter Phone Number" aria-label="Phone number" autoComplete="tel" value={form.phone} onChange={handleChange} />
        </div>
        <div className="input-wrap">
          <Icon name="lock" size={22} />
          <input className="input" type="password" name="password" placeholder="Enter password" aria-label="Password" autoComplete="current-password" value={form.password} onChange={handleChange} />
        </div>

        <div className="auth-rule" />

        <button type="button" className="social-btn" onClick={() => socialClick('Google')}><GoogleIcon /> Login Via Google</button>
        <button type="button" className="social-btn" onClick={() => socialClick('Facebook')}><FacebookIcon /> Login Via Facebook</button>
        <button type="button" className="social-btn" onClick={() => socialClick('X')}><XIcon /> Login Via X</button>

        <div className="auth-actions">
          <div className="auth-links">
            <button type="button" className="btn btn--link" style={{ color: 'inherit' }} onClick={() => setNotice('Password reset by email is not set up yet. Please contact FixMate support from the Contact page.')}>
              Forgot password?
            </button>
            <br />
            New to FixMate? <Link to="/register">Register</Link>
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Signing in...' : 'Continue'}</button>
        </div>
      </div>
    </form>
  );
}
