// Home page - every list on this page (services, providers, reviews, categories) comes from the API.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Icon, { iconFor } from '../components/Icon';
import ServiceCard from '../components/ServiceCard';
import ProviderCard from '../components/ProviderCard';
import { Alert, Loading, Stars } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { fetchCategories, fetchServices, selectCategories, selectServices, selectServiceStatus, selectServiceError } from '../redux/slices/serviceSlice';
import { setDraft } from '../redux/slices/bookingSlice';
import { providersApi, reviewsApi } from '../services/api';
import { Avatar } from '../components/ui';

const STEPS = [
  ['Choose a service', 'Browse plumbing, electrical, carpentry, painting and more, with clear starting prices.'],
  ['Pick a provider and time', 'Compare ratings and experience, then choose a date and time that suits you.'],
  ['We send a professional', 'Your provider accepts the job and arrives at your door at the booked time.'],
  ['Pay and rate', 'Once the work is done, rate your provider so others can book with confidence.'],
];

const REASONS = [
  ['shield', 'Verified professionals', 'Every provider on FixMate is reviewed by our team before they can take jobs.'],
  ['rupee', 'Upfront pricing', 'See the starting price before you book. No surprise charges at the door.'],
  ['clock', 'On-time visits', 'Pick your own slot. Providers confirm the time and cannot be double-booked.'],
  ['star', 'Real customer reviews', 'Only customers with a completed job can leave a rating, so reviews stay honest.'],
];

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const services = useSelector(selectServices);
  const categories = useSelector(selectCategories);
  const serviceStatus = useSelector(selectServiceStatus);
  const serviceError = useSelector(selectServiceError);
  const [query, setQuery] = useState('');

  // useEffect: load data when the page opens
  useEffect(() => {
    dispatch(fetchServices({ limit: 6, sort: 'name' }));
    dispatch(fetchCategories());
  }, [dispatch]);

  const providersState = useFetch(() => providersApi.list({ limit: 3 }), []);
  const reviewsState = useFetch(() => reviewsApi.featured(), []);

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/services?q=${encodeURIComponent(query.trim())}` : '/services');
  };

  const handleBook = (service) => {
    dispatch(setDraft({ service_id: service.id, provider_id: '' }));
    navigate('/booking');
  };

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero photo-bg" aria-labelledby="hero-title">
        <div className="container">
          <div className="glass hero__panel">
            <h1 id="hero-title">Reliable Home Repairs, Right When You Need Them</h1>
            <p className="lead">Trusted professionals for quick, reliable and quality home repair services.</p>
            <div className="hero__actions">
              <Link to="/booking" className="btn btn--primary">Book a Service</Link>
              <Link to="/services" className="btn btn--light">Explore Services</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Search ---------- */}
      <section className="section" aria-labelledby="search-title" style={{ paddingBottom: 24 }}>
        <div className="container">
          <div className="card" style={{ padding: 28 }}>
            <h2 id="search-title" style={{ fontSize: '1.4rem' }}>What needs fixing today?</h2>
            <form className="hero__search" onSubmit={handleSearch} role="search">
              <div className="input-wrap">
                <Icon name="search" size={20} />
                <input className="input" type="search" placeholder="Search a service, e.g. leaking tap, AC service" aria-label="Search services" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <button type="submit" className="btn btn--primary">Search</button>
            </form>
            {categories.length > 0 && (
              <div className="row" style={{ marginTop: 16, gap: 8 }}>
                {categories.map((c) => (
                  <Link key={c.id} to={`/services?category=${encodeURIComponent(c.name)}`} className="btn btn--light btn--sm">
                    <Icon name={iconFor(c.image)} size={16} /> {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Popular services ---------- */}
      <section className="section" aria-labelledby="popular-title">
        <div className="container">
          <div className="section__head section__head--row">
            <div>
              <h2 id="popular-title">Popular services</h2>
              <p style={{ margin: 0 }}>Fixed starting prices, booked in a few clicks.</p>
            </div>
            <Link to="/services" className="btn btn--outline btn--sm">View all services</Link>
          </div>
          {serviceStatus === 'loading' && services.length === 0 && <Loading text="Loading services..." />}
          {serviceStatus === 'failed' && <Alert onRetry={() => dispatch(fetchServices({ limit: 6, sort: 'name' }))}>{serviceError}</Alert>}
          <div className="grid grid--cards">
            {services.map((service) => <ServiceCard key={service.id} service={service} onBook={handleBook} />)}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section section--sand" aria-labelledby="how-title">
        <div className="container">
          <div className="section__head">
            <h2 id="how-title">How FixMate works</h2>
            <p>From first click to finished repair in four steps.</p>
          </div>
          <ol className="steps" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {STEPS.map(([title, text], index) => (
              <li className="step" key={title}>
                <div className="step__num">{index + 1}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Why choose ---------- */}
      <section className="section" aria-labelledby="why-title">
        <div className="container">
          <div className="section__head">
            <h2 id="why-title">Why choose FixMate</h2>
            <p>Our home repair brand is built on trust, reliability, and quality craftsmanship.</p>
          </div>
          <div className="features">
            {REASONS.map(([icon, title, text]) => (
              <div className="card feature" key={title}>
                <span className="icon-tile"><Icon name={icon} size={24} /></span>
                <h3 style={{ marginTop: 14, marginBottom: 0 }}>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Featured providers ---------- */}
      <section className="section section--sand" aria-labelledby="providers-title">
        <div className="container">
          <div className="section__head section__head--row">
            <div>
              <h2 id="providers-title">Top-rated service providers</h2>
              <p style={{ margin: 0 }}>Experienced professionals your neighbours already trust.</p>
            </div>
            <Link to="/providers" className="btn btn--outline btn--sm">Meet all providers</Link>
          </div>
          {providersState.loading && <Loading text="Loading providers..." />}
          {providersState.error && <Alert onRetry={providersState.reload}>{providersState.error}</Alert>}
          <div className="grid grid--cards">
            {providersState.data?.providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </div>
      </section>

      {/* ---------- Customer reviews ---------- */}
      <section className="section" aria-labelledby="reviews-title">
        <div className="container">
          <div className="section__head">
            <h2 id="reviews-title">What customers say</h2>
            <p>Reviews come only from customers whose job was completed.</p>
          </div>
          {reviewsState.loading && <Loading text="Loading reviews..." />}
          {reviewsState.error && <Alert onRetry={reviewsState.reload}>{reviewsState.error}</Alert>}
          <div className="grid grid--cards">
            {reviewsState.data?.reviews.map((review) => (
              <figure key={review.id} className="card review-card" style={{ margin: 0 }}>
                <Stars value={review.rating} />
                <blockquote>&ldquo;{review.comment}&rdquo;</blockquote>
                <footer className="row" style={{ gap: 10 }}>
                  <Avatar name={review.customer?.name} size={36} />
                  <span>
                    <strong>{review.customer?.name}</strong>
                    <span className="muted small" style={{ display: 'block' }}>{review.booking?.service?.name}</span>
                  </span>
                </footer>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Call to action ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta">
            <h2>Something broken at home?</h2>
            <p>Book a trusted professional in minutes. Most requests are accepted the same day.</p>
            <Link to="/booking" className="btn btn--light">Book a Service</Link>
          </div>
        </div>
      </section>
    </>
  );
}
