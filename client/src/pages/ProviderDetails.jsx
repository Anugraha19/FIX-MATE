// Provider details - GET /api/providers/:id returns profile, services, reviews, availability and completed jobs.
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Icon from '../components/Icon';
import { Alert, Avatar, EmptyState, Loading, Stars } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { providersApi } from '../services/api';
import { setDraft } from '../redux/slices/bookingSlice';
import { formatDate, formatPrice, formatTime, splitSkills } from '../utils/format';

export default function ProviderDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => providersApi.get(id), [id]);

  const book = (serviceId) => {
    dispatch(setDraft({ service_id: serviceId, provider_id: Number(id) }));
    navigate('/booking');
  };

  if (loading) return <Loading text="Loading provider..." />;
  if (error) {
    return (
      <div className="container page-body">
        <Alert onRetry={reload}>{error}</Alert>
        <p><Link to="/providers" className="btn btn--outline btn--sm">Back to providers</Link></p>
      </div>
    );
  }

  const { provider, reviews, completedJobs, availability } = data;
  const name = provider.user.name;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="breadcrumbs"><Link to="/providers">Providers</Link> / {name}</div>
          <div className="row" style={{ gap: 20 }}>
            <Avatar name={name} image={provider.user.profile_image} size={84} />
            <div>
              <h1 style={{ marginBottom: 6 }}>{name}</h1>
              <div className="row" style={{ gap: 16 }}>
                <Stars value={provider.rating} showValue />
                <span className="muted">{provider.review_count} review{provider.review_count === 1 ? '' : 's'}</span>
                <span><span className={`dot dot--${provider.availability_status}`} /> {provider.availability_status}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container page-body">
        <div className="detail-grid">
          <div className="stack" style={{ gap: 24 }}>
            <div className="card">
              <h3 className="card__title">Profile</h3>
              <div className="facts" style={{ marginTop: 0 }}>
                <div className="fact"><span>Experience</span><strong>{provider.experience} years</strong></div>
                <div className="fact"><span>Location</span><strong>{provider.location || provider.user.city || '-'}</strong></div>
                <div className="fact"><span>Jobs completed</span><strong>{provider.completed_jobs}</strong></div>
              </div>
              <h4>Skills</h4>
              <div className="row" style={{ gap: 8 }}>
                {splitSkills(provider.skills).map((s) => <span className="tag" key={s}>{s}</span>)}
                {splitSkills(provider.skills).length === 0 && <span className="muted">No skills listed yet.</span>}
              </div>
            </div>

            <div className="card">
              <h3 className="card__title">Services offered</h3>
              {provider.services.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>This provider has not added services yet.</p>
              ) : (
                <ul className="list-plain">
                  {provider.services.map((s) => (
                    <li key={s.id} className="row between">
                      <div>
                        <Link to={`/services/${s.id}`}><strong>{s.name}</strong></Link>
                        <span className="muted small" style={{ display: 'block' }}>{s.category?.name} - from {formatPrice(s.price)}</span>
                      </div>
                      <button type="button" className="btn btn--primary btn--sm" disabled={provider.availability_status === 'unavailable'} onClick={() => book(s.id)}>Book</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <h3 className="card__title">Reviews</h3>
              {reviews.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>No reviews yet.</p>
              ) : (
                <ul className="list-plain">
                  {reviews.map((r) => (
                    <li key={r.id}>
                      <div className="row between">
                        <Stars value={r.rating} size={14} />
                        <span className="small muted">{formatDate(r.createdAt)}</span>
                      </div>
                      <p style={{ margin: '6px 0 2px' }}>{r.comment || <span className="muted">No comment</span>}</p>
                      <span className="small muted">{r.customer?.name}{r.booking?.service ? ` - ${r.booking.service.name}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="stack sticky-card">
            <div className="card">
              <h3 className="card__title"><Icon name="calendar" size={18} /> Availability</h3>
              {availability.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>No specific time windows added. Choose any time slot when booking and the provider will confirm.</p>
              ) : (
                <ul className="list-plain">
                  {availability.map((slot) => (
                    <li key={slot.id} className="row between small">
                      <span>{formatDate(slot.available_date)}</span>
                      <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card">
              <h3 className="card__title"><Icon name="clipboard" size={18} /> Previous jobs</h3>
              {completedJobs.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>No completed jobs yet.</p>
              ) : (
                <ul className="list-plain">
                  {completedJobs.map((job) => (
                    <li key={job.id} className="row between small">
                      <span>{job.service?.name}</span>
                      <span className="muted">{formatDate(job.booking_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {provider.services.length === 0 && (
              <EmptyState icon="tools" title="Not bookable yet" message="Pick a service first, then choose a provider." action={<Link to="/services" className="btn btn--primary btn--sm">Browse services</Link>} />
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
