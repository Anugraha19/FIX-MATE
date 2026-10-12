// Admin: reviews - list and remove (GET /api/admin/reviews, DELETE /api/admin/reviews/:id).
import { useState } from 'react';
import { DashHead } from '../../components/DashboardLayout';
import { ConfirmModal } from '../../components/Modal';
import { Alert, EmptyState, Loading, Pagination, Stars } from '../../components/ui';
import useFetch from '../../hooks/useFetch';
import { adminApi, getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';

export default function AdminReviews() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => adminApi.reviews({ page, limit: 10 }), [page]);
  const [deleting, setDeleting] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await adminApi.removeReview(deleting.id);
      setDeleting(null);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DashHead title="Reviews" subtitle="Remove reviews that break the rules. Provider ratings update automatically." />
      {error && <Alert onRetry={reload}>{error}</Alert>}
      {actionError && <div style={{ marginBottom: 12 }}><Alert>{actionError}</Alert></div>}
      {loading && !data && <Loading />}
      {data && data.reviews.length === 0 && <EmptyState icon="star" title="No reviews yet" />}

      {data && data.reviews.length > 0 && (
        <div className="card table-card" style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Customer</th><th>Provider</th><th>Service</th><th>Rating</th><th>Comment</th><th>Actions</th></tr></thead>
              <tbody>
                {data.reviews.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Date">{formatDate(r.createdAt)}</td>
                    <td data-label="Customer">{r.customer?.name}</td>
                    <td data-label="Provider">{r.provider?.user?.name}</td>
                    <td data-label="Service">{r.booking?.service?.name}</td>
                    <td data-label="Rating"><Stars value={r.rating} size={13} /></td>
                    <td data-label="Comment" style={{ maxWidth: 320 }}>{r.comment || <span className="muted">-</span>}</td>
                    <td className="cell-actions"><div className="actions"><button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(r)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />

      {deleting && (
        <ConfirmModal
          title="Delete this review?"
          message="The review will be removed and the provider's average rating recalculated."
          confirmLabel="Delete review"
          danger
          busy={busy}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
