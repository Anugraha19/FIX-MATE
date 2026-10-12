// Small reusable UI pieces: Loading, EmptyState, Alert, Stars, StatusBadge, Avatar, StatCard, Pagination.
import Icon from './Icon';
import { initials, statusClass } from '../utils/format';

export function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}

export function EmptyState({ icon = 'search', title, message, action }) {
  return (
    <div className="empty">
      <span className="icon-tile"><Icon name={icon} size={24} /></span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

// type: error | success | info
export function Alert({ type = 'error', children, onRetry }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
      {onRetry && (
        <>
          {' '}
          <button type="button" className="btn btn--link" onClick={onRetry}>Try again</button>
        </>
      )}
    </div>
  );
}

// Star rating. Display only by default; pass onChange to make it clickable.
export function Stars({ value = 0, onChange, size = 16, showValue = false }) {
  const rounded = Math.round(Number(value));
  if (onChange) {
    return (
      <div className="stars stars--input" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={n <= value ? 'on' : ''} onClick={() => onChange(n)} role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            <Icon name="star" size={size + 8} filled />
          </button>
        ))}
      </div>
    );
  }
  return (
    <span className="stars" aria-label={`Rated ${Number(value).toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} filled={n <= rounded} className={n <= rounded ? '' : 'muted'} />
      ))}
      {showValue && <span className="stars__value">{Number(value) > 0 ? Number(value).toFixed(1) : 'New'}</span>}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge badge--${statusClass(status)}`}>{status}</span>;
}

export function Avatar({ name, image, size = 48 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {image ? <img src={image} alt="" /> : initials(name)}
    </span>
  );
}

export function StatCard({ icon, label, value, dark = false }) {
  return (
    <div className={`card stat-card ${dark ? 'stat-card--dark' : ''}`}>
      <span className="icon-tile"><Icon name={icon} size={24} /></span>
      <div>
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn--light btn--sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="small muted">Page {page} of {pages}</span>
      <button type="button" className="btn btn--light btn--sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}

// Labelled form field: <Field label="Email" error={errors.email}><input .../></Field>
export function Field({ label, htmlFor, error, hint, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error" role="alert">{error}</span>}
    </div>
  );
}
