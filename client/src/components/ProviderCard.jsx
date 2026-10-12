// ProviderCard - shows one provider (name, avatar, category, experience, rating, location, availability).
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { Avatar, Stars } from './ui';

const AVAILABILITY_LABEL = { available: 'Available', busy: 'Busy', unavailable: 'Unavailable' };

export default function ProviderCard({ provider }) {
  const name = provider.user?.name || 'Provider';
  const categories = [...new Set((provider.services || []).map((s) => s.category?.name).filter(Boolean))];

  return (
    <article className="card provider-card">
      <div className="provider-card__head">
        <Avatar name={name} image={provider.user?.profile_image} size={56} />
        <div>
          <h3 style={{ margin: 0 }}>{name}</h3>
          <Stars value={provider.rating} size={14} showValue />
        </div>
      </div>

      <div className="row" style={{ gap: 6 }}>
        {categories.length > 0 ? categories.map((c) => <span key={c} className="tag">{c}</span>) : <span className="tag">General repairs</span>}
      </div>

      <div className="provider-card__facts">
        <span><Icon name="briefcase" size={15} /> {provider.experience} yr experience</span>
        <span><Icon name="pin" size={15} /> {provider.location || provider.user?.city || '-'}</span>
        <span><span className={`dot dot--${provider.availability_status}`} /> {AVAILABILITY_LABEL[provider.availability_status]}</span>
        <span><Icon name="check" size={15} /> {provider.completed_jobs ?? 0} jobs done</span>
      </div>

      <Link to={`/providers/${provider.id}`} className="btn btn--outline btn--sm" style={{ marginTop: 'auto' }}>
        View Profile
      </Link>
    </article>
  );
}
