// ProtectedRoute - only lets logged-in users with the right role open a page.
//   <Route element={<ProtectedRoute roles={['admin']} />}> ...admin pages... </Route>
// The BACKEND checks the role again on every API call, so this is only for a good user experience.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './ui';
import { dashboardPathFor } from '../utils/format';

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, role, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) return <Loading text="Checking your session..." />;

  if (!isAuthenticated) {
    // remember where the user wanted to go, so we can return after login
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(role)) {
    // wrong role: send them to their own dashboard
    return <Navigate to={dashboardPathFor(role)} replace />;
  }

  return <Outlet />;
}
