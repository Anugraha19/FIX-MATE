// bookingSlice - REDUX state for bookings: the list, dashboard numbers, the booking draft and the last booking made.
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingsApi, getErrorMessage } from '../../services/api';

export const createBooking = createAsyncThunk('bookings/create', async (form, { rejectWithValue }) => {
  try {
    const data = await bookingsApi.create(form);
    return data.booking;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchBookings = createAsyncThunk('bookings/fetch', async (params, { rejectWithValue }) => {
  try {
    return await bookingsApi.list(params);
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const cancelBooking = createAsyncThunk('bookings/cancel', async (id, { rejectWithValue }) => {
  try {
    const data = await bookingsApi.cancel(id);
    return data.booking;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// action = 'accept' | 'reject' | 'start' | 'complete'
export const runBookingAction = createAsyncThunk('bookings/action', async ({ id, action }, { rejectWithValue }) => {
  try {
    const data = await bookingsApi.action(id, action);
    return data.booking;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const replaceBooking = (state, updated) => {
  const index = state.list.findIndex((b) => b.id === updated.id);
  if (index !== -1) state.list[index] = updated;
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    list: [],
    total: 0,
    pages: 1,
    stats: { total: 0, byStatus: {}, earnings: 0 },
    status: 'idle', // idle | loading | failed
    error: null,
    actionError: null,
    draft: { service_id: '', provider_id: '' }, // service/provider picked on the services pages
    lastBooking: null, // shown on the confirmation page
  },
  reducers: {
    setDraft(state, action) {
      state.draft = { ...state.draft, ...action.payload };
    },
    clearDraft(state) {
      state.draft = { service_id: '', provider_id: '' };
    },
    clearActionError(state) {
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.status = 'idle';
        state.list = action.payload.bookings;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.stats = action.payload.stats;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.lastBooking = action.payload;
        state.draft = { service_id: '', provider_id: '' };
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.actionError = null;
        replaceBooking(state, action.payload);
      })
      .addCase(runBookingAction.fulfilled, (state, action) => {
        state.actionError = null;
        replaceBooking(state, action.payload);
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.actionError = action.payload;
      })
      .addCase(runBookingAction.rejected, (state, action) => {
        state.actionError = action.payload;
      });
  },
});

export const { setDraft, clearDraft, clearActionError } = bookingSlice.actions;

export const selectBookings = (state) => state.bookings.list;
export const selectBookingStats = (state) => state.bookings.stats;
export const selectBookingStatus = (state) => state.bookings.status;
export const selectBookingError = (state) => state.bookings.error;
export const selectActionError = (state) => state.bookings.actionError;
export const selectDraft = (state) => state.bookings.draft;
export const selectLastBooking = (state) => state.bookings.lastBooking;

export default bookingSlice.reducer;
