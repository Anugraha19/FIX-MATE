// Contact page. The form opens the visitor's own email app (mailto:) because FixMate has no mail server of its own.
import { useState } from 'react';
import Icon from '../components/Icon';
import { Field } from '../components/ui';

const SUPPORT_EMAIL = 'support@fixmate.example';

export default function Contact() {
  const [form, setForm] = useState({ name: '', subject: '', message: '' });
  const [error, setError] = useState('');

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return setError('Enter your name and a message.');
    const subject = encodeURIComponent(form.subject.trim() || 'FixMate enquiry');
    const body = encodeURIComponent(`${form.message.trim()}\n\n- ${form.name.trim()}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Contact us</h1>
          <p>Questions about a booking, becoming a provider, or your account? We are happy to help.</p>
        </div>
      </section>
      <div className="container page-body">
        <div className="detail-grid">
          <form className="card stack" onSubmit={submit} noValidate>
            <h3>Send us a message</h3>
            {error && <div className="alert alert--error" role="alert">{error}</div>}
            <div className="form-grid">
              <Field label="Your name" htmlFor="ct-name"><input id="ct-name" name="name" className="input" value={form.name} onChange={change} autoComplete="name" /></Field>
              <Field label="Subject" htmlFor="ct-subject"><input id="ct-subject" name="subject" className="input" value={form.subject} onChange={change} /></Field>
              <Field label="Message" htmlFor="ct-message" className="full"><textarea id="ct-message" name="message" className="textarea" value={form.message} onChange={change} /></Field>
            </div>
            <div className="row between">
              <span className="small muted">This opens your email app with the message ready to send.</span>
              <button type="submit" className="btn btn--primary">Send message</button>
            </div>
          </form>

          <aside className="stack">
            {[
              ['mail', 'Email', SUPPORT_EMAIL],
              ['phone', 'Phone', '+91 98000 00001 (9 AM - 7 PM)'],
              ['pin', 'Office', 'FixMate Head Office, MG Road, Kochi'],
            ].map(([icon, label, value]) => (
              <div className="card row" style={{ flexWrap: 'nowrap' }} key={label}>
                <span className="icon-tile"><Icon name={icon} size={22} /></span>
                <div><strong>{label}</strong><div className="muted">{value}</div></div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </>
  );
}
