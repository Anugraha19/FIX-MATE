// ServiceCard - receives a `service` object through PROPS and draws it.
//   <ServiceCard service={service} onBook={handleBook} />
import { Link } from 'react-router-dom';
import Icon, { iconFor } from './Icon';
import { Stars } from './ui';
import { formatPrice, formatDuration } from '../utils/format';

export default function ServiceCard({ service, onBook }) {
  return (
    <article className="card service-card">
      <div className="service-card__top">
        <span className="icon-tile"><Icon name={iconFor(service.image)} size={26} /></span>
        {service.category && <span className="tag">{service.category.name}</span>}
      </div>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <div className="row small muted" style={{ gap: 16 }}>
        <span className="row" style={{ gap: 6 }}><Icon name="clock" size={15} /> {formatDuration(service.duration)}</span>
        <Stars value={service.rating} size={14} showValue />
      </div>
      <div className="service-card__meta">
        <span className="price"><small>Starting at </small>{formatPrice(service.price)}</span>
      </div>
      <div className="service-card__actions">
        <Link to={`/services/${service.id}`} className="btn btn--outline btn--sm">View Details</Link>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => onBook(service)}>Book Now</button>
      </div>
    </article>
  );
}
