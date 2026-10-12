// Service details - GET /api/services/:id returns the service and the providers who offer it.
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Icon, { iconFor } from '../components/Icon';
import { Alert, Avatar, EmptyState, Loading, Stars } from '../components/ui';
import { clearSelected, fetchServiceById, selectSelectedService } from '../redux/slices/serviceSlice';
import { setDraft } from '../redux/slices/bookingSlice';
import { formatDuration, formatPrice } from '../utils/format';

export default function ServiceDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selected = useSelector(selectSelectedService);
  const { detailStatus, error } = useSelector((state) => state.services);

  useEffect(() => {
    dispatch(fetchServiceById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  const book = (providerId = '') => {
    dispatch(setDraft({ service_id: Number(id), provider_id: providerId }));
    navigate('/booking');
  };

  if (detailStatus === 'loading' || (detailStatus === 'idle' && !selected)) return <Loading text="Loading service..." />;
  if (detailStatus === 'failed') {
    return (
      <div className="container page-body">
        <Alert>{error}</Alert>
        <p><Link to="/services" className="btn btn--outline btn--sm">Back to services</Link></p>
      </div>
    );
  }

  const { service, providers } = selected;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="breadcrumbs"><Link to="/services">Services</Link> / {service.category?.name}</div>
          <h1>{service.name}</h1>
        </div>
      </section>

      <div className="container page-body">
        <div className="detail-grid">
          <div className="stack" style={{ gap: 24 }}>
            <div className="card">
              <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
                <span className="icon-tile" style={{ width: 64, height: 64 }}><Icon name={iconFor(service.image)} size={32} /></span>
                <div>
                  <span className="tag">{service.category?.name}</span>
                  <p style={{ margin: '10px 0 0' }}>{service.description}</p>
                </div>
              </div>
              <div className="facts">
                <div className="fact"><span>Starting price</span><strong>{formatPrice(service.price)}</strong></div>
                <div className="fact"><span>Estimated duration</span><strong>{formatDuration(service.duration)}</strong></div>
                <div className="fact"><span>Category</span><strong>{service.category?.name}</strong></div>
                <div className="fact">
                  <span>Customer rating</span>
                  <strong><Stars value={service.rating} size={14} showValue /> {service.review_count > 0 && <span className="muted small">({service.review_count})</span>}</strong>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '1.4rem' }}>Available providers</h2>
              {providers.length === 0 ? (
                <EmptyState icon="users" title="No providers yet" message="No provider offers this service right now. You can still book it and our team will assign someone." />
              ) : (
                <div className="stack">
                  {providers.map((p) => (
                    <div className="card row between" key={p.id}>
                      <div className="row" style={{ gap: 14 }}>
                        <Avatar name={p.user.name} image={p.user.profile_image} size={52} />
                        <div>
                          <strong>{p.user.name}</strong>
                          <div className="row small muted" style={{ gap: 12 }}>
                            <Stars value={p.rating} size={13} showValue />
                            <span>{p.experience} yr experience</span>
                            <span><span className={`dot dot--${p.availability_status}`} /> {p.availability_status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <Link to={`/providers/${p.id}`} className="btn btn--outline btn--sm">View Profile</Link>
                        <button type="button" className="btn btn--primary btn--sm" disabled={p.availability_status === 'unavailable'} onClick={() => book(p.id)}>Book with {p.user.name.split(' ')[0]}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="card sticky-card">
            <h3>Book this service</h3>
            <div className="price" style={{ fontSize: '1.7rem', marginBottom: 6 }}><small>from </small>{formatPrice(service.price)}</div>
            <p className="small muted">Final price is confirmed by your provider after they see the problem.</p>
            <button type="button" className="btn btn--primary btn--block" onClick={() => book('')}>Book Service</button>
          </aside>
        </div>
      </div>
    </>
  );
}
