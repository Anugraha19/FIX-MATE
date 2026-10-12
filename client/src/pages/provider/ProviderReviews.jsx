// Provider reviews: GET /api/reviews/provider/:providerId
import { DashHead } from '../../components/DashboardLayout';
import { Alert, EmptyState, Loading, StatCard, Stars } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import useFetch from '../../hooks/useFetch';
import { reviewsApi } from '../../services/api';
import { formatDate } from '../../utils/format';

export default function ProviderReviews() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => reviewsApi.forProvider(user.provider.id), [user.provider?.id]);

  if (loading) return <Loading />;
  if (error) return <Alert onRetry={reload}>{error}</Alert>;

  return (
    <>
      <DashHead title="Reviews" subtitle="What customers say about your work." />
      <div className="grid grid--stats" style={{ marginBottom: 24 }}>
        <StatCard icon="star" label="Average rating" value={data.average ? data.average.toFixed(1) : '-'} dark />
        <StatCard icon="message" label="Total reviews" value={data.count} />
      </div>
      {data.reviews.length === 0 ? (
        <EmptyState icon="star" title="No reviews yet" message="Reviews appear here after customers rate your completed jobs." />
      ) : (
        <div className="stack">
          {data.reviews.map((r) => (
            <div className="card" key={r.id}>
              <div className="row between">
                <Stars value={r.rating} />
                <span className="small muted">{formatDate(r.createdAt)}</span>
              </div>
              <p style={{ margin: '8px 0 4px' }}>{r.comment || <span className="muted">No comment</span>}</p>
              <span className="small muted">{r.customer?.name} - {r.booking?.service?.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
