// Customer reviews: reviews I wrote + completed jobs that still need a review.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashHead } from '../../components/DashboardLayout';
import ReviewModal from '../../components/ReviewModal';
import { Alert, EmptyState, Loading, Stars } from '../../components/ui';
import useFetch from '../../hooks/useFetch';
import { bookingsApi, reviewsApi } from '../../services/api';
import { formatDate } from '../../utils/format';

export default function CustomerReviews() {
  const mine = useFetch(() => reviewsApi.mine(), []);
  const completed = useFetch(() => bookingsApi.list({ status: 'Completed', limit: 100 }), []);
  const [toReview, setToReview] = useState(null);

  const waiting = (completed.data?.bookings || []).filter((b) => !b.review && b.provider);
  const reload = () => {
    mine.reload();
    completed.reload();
  };

  if (mine.loading || completed.loading) return <Loading text="Loading reviews..." />;

  return (
    <>
      <DashHead title="Reviews" subtitle="Rate completed jobs and see what you have written." />
      {(mine.error || completed.error) && <Alert onRetry={reload}>{mine.error || completed.error}</Alert>}

      <h2 style={{ fontSize: '1.2rem' }}>Waiting for your review</h2>
      {waiting.length === 0 ? (
        <p className="muted">All your completed jobs have been reviewed.</p>
      ) : (
        <div className="stack" style={{ marginBottom: 28 }}>
          {waiting.map((b) => (
            <div className="card row between" key={b.id}>
              <div>
                <strong>{b.service?.name}</strong>
                <div className="small muted">by {b.provider.user.name} on {formatDate(b.booking_date)}</div>
              </div>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => setToReview(b)}>Leave a review</button>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.2rem' }}>My reviews</h2>
      {mine.data?.reviews.length === 0 ? (
        <EmptyState icon="star" title="No reviews yet" message="After a job is completed you can rate your provider here." action={<Link to="/customer/bookings" className="btn btn--outline btn--sm">View my bookings</Link>} />
      ) : (
        <div className="stack">
          {mine.data?.reviews.map((r) => (
            <div className="card" key={r.id}>
              <div className="row between">
                <strong>{r.booking?.service?.name}</strong>
                <span className="small muted">{formatDate(r.createdAt)}</span>
              </div>
              <div className="small muted" style={{ marginBottom: 6 }}>Provider: {r.provider?.user?.name}</div>
              <Stars value={r.rating} />
              {r.comment && <p style={{ margin: '8px 0 0' }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {toReview && <ReviewModal booking={toReview} onClose={() => setToReview(null)} onDone={() => { setToReview(null); reload(); }} />}
    </>
  );
}
