import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <div className="container page-body">
      <EmptyState
        icon="search"
        title="We could not find that page"
        message="The link may be broken or the page may have moved."
        action={<Link to="/" className="btn btn--primary btn--sm">Go to home</Link>}
      />
    </div>
  );
}
