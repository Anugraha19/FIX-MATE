// ReviewModal - a customer rates a completed booking: POST /api/reviews
import { useState } from 'react';
import Modal from './Modal';
import { Alert, Field, Stars } from './ui';
import { reviewsApi, getErrorMessage } from '../services/api';

export default function ReviewModal({ booking, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) return setError('Choose a star rating from 1 to 5.');
    setSaving(true);
    setError('');
    try {
      await reviewsApi.create({ booking_id: booking.id, rating, comment: comment.trim() });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Rate your service"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--light" onClick={onClose}>Not now</button>
          <button type="submit" form="review-form" className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Submit review'}</button>
        </>
      }
    >
      <form id="review-form" className="stack" onSubmit={submit} noValidate>
        <p style={{ margin: 0 }}>
          How was <strong>{booking.service?.name}</strong>{booking.provider ? <> by <strong>{booking.provider.user.name}</strong></> : null}?
        </p>
        {error && <Alert>{error}</Alert>}
        <Stars value={rating} onChange={setRating} size={22} />
        <Field label="Comment (optional)" htmlFor="review-comment">
          <textarea id="review-comment" className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell others about the work, timing and behaviour." />
        </Field>
      </form>
    </Modal>
  );
}
