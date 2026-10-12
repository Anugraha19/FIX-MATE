// authSlice - REDUX state for "who is logged in".
// createSlice builds the reducer + action creators; createAsyncThunk handles API calls.
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi, getErrorMessage, TOKEN_KEY } from '../../services/api';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const registerUser = createAsyncThunk('auth/register', async (form, { rejectWithValue }) => {
  try {
    const data = await authApi.register(form);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// On page refresh: ask the server who the saved token belongs to.
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.me();
    return data.user;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const initialState = {
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  status: 'idle', // idle | loading | failed
  error: null,
  initialized: !localStorage.getItem(TOKEN_KEY), // true when there is nothing to restore
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem(TOKEN_KEY);
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      state.initialized = true;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login + register share the same success/failure handling
      .addMatcher(
        (action) => [loginUser.pending.type, registerUser.pending.type].includes(action.type),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        (action) => [loginUser.fulfilled.type, registerUser.fulfilled.type].includes(action.type),
        (state, action) => {
          state.status = 'idle';
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.initialized = true;
        }
      )
      .addMatcher(
        (action) => [loginUser.rejected.type, registerUser.rejected.type].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload || 'Something went wrong';
        }
      )
      .addMatcher(
        (action) => action.type === fetchMe.fulfilled.type,
        (state, action) => {
          state.user = action.payload;
          state.initialized = true;
        }
      )
      .addMatcher(
        (action) => action.type === fetchMe.rejected.type,
        (state) => {
          // the saved token no longer works
          localStorage.removeItem(TOKEN_KEY);
          state.user = null;
          state.token = null;
          state.initialized = true;
        }
      );
  },
});

export const { logout, setUser, clearAuthError } = authSlice.actions;

// selectors: small functions that read pieces of the state
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.user);
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthInitialized = (state) => state.auth.initialized;

export default authSlice.reducer;
