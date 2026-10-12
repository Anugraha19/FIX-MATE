// About page (static content).
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const VALUES = [
  ['shield', 'Trust', 'Every provider is checked before joining, and every review comes from a completed job.'],
  ['clock', 'Reliability', 'Booked slots are protected, so a provider is never double-booked and you are never kept waiting.'],
  ['hammer', 'Quality craftsmanship', 'We match you with people who have years of experience in exactly the job you need.'],
];

export default function About() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>About FixMate</h1>
          <p>Quick, professional solutions for all your home maintenance needs, from minor fixes to essential repairs.</p>
        </div>
      </section>
      <div className="container page-body">
        <div className="detail-grid">
          <div className="stack" style={{ gap: 16 }}>
            <h2>Why we built FixMate</h2>
            <p>
              Finding a reliable plumber, electrician or carpenter used to mean asking around, waiting for call-backs and hoping the person
              turned up. FixMate puts verified home repair professionals in one place, so you can compare, book and track a job from your phone.
            </p>
            <p>
              Customers see clear starting prices and real ratings. Providers get a simple dashboard for requests, schedules and earnings.
              Our admin team keeps the marketplace fair by managing providers, services and reviews.
            </p>
            <p>
              Our home repair brand is built on trust, reliability, and quality craftsmanship, ensuring your home stays safe, comfortable, and well cared for.
            </p>
            <div className="row">
              <Link to="/services" className="btn btn--primary">Explore services</Link>
              <Link to="/register" className="btn btn--outline">Join as a provider</Link>
            </div>
          </div>
          <div className="stack">
            {VALUES.map(([icon, title, text]) => (
              <div className="card row" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'nowrap' }} key={title}>
                <span className="icon-tile"><Icon name={icon} size={24} /></span>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{title}</h3>
                  <p className="muted small" style={{ margin: 0 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
