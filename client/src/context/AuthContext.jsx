// AuthContext - React Context that shares login info and login/logout functions with every component.
// It sits on top of the Redux auth slice: Redux STORES the data, Context gives components an easy way to USE it.
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  registerUser,
  fetchMe,
  logout as logoutAction,
  clearAuthError,
  selectUser,
  selectAuthStatus,
  selectAuthError,
  selectAuthInitialized,
} from '../redux/slices/authSlice';
import { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const initialized = useSelector(selectAuthInitialized);

  // When the page loads and a token is saved, ask the server who it belongs to.
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) dispatch(fetchMe());
  }, [dispatch]);

  // The API layer fires this event when the server says the token is invalid/expired.
  useEffect(() => {
    const handleUnauthorized = () => dispatch(logoutAction());
    window.addEventListener('fixmate:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('fixmate:unauthorized', handleUnauthorized);
  }, [dispatch]);

  // useCallback keeps the same function between renders, so child components do not re-run effects needlessly.
  const login = useCallback((credentials) => dispatch(loginUser(credentials)).unwrap(), [dispatch]);
  const register = useCallback((form) => dispatch(registerUser(form)).unwrap(), [dispatch]);
  const logout = useCallback(() => dispatch(logoutAction()), [dispatch]);
  const clearError = useCallback(() => dispatch(clearAuthError()), [dispatch]);

  const value = useMemo(
    () => ({ user, role: user?.role, isAuthenticated: Boolean(user), initialized, loading: status === 'loading', error, login, register, logout, clearError }),
    [user, initialized, status, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook: const { user, login } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
