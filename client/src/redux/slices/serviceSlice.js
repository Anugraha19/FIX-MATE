// serviceSlice - REDUX state for the service list, categories and the service the visitor is looking at.
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { servicesApi, categoriesApi, getErrorMessage } from '../../services/api';

// Filters (category, price, rating ...) are sent to the backend, which does the searching in MySQL.
export const fetchServices = createAsyncThunk('services/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await servicesApi.list(params);
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchCategories = createAsyncThunk('services/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const data = await categoriesApi.list();
    return data.categories;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchServiceById = createAsyncThunk('services/fetchOne', async (id, { rejectWithValue }) => {
  try {
    return await servicesApi.get(id);
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const serviceSlice = createSlice({
  name: 'services',
  initialState: {
    items: [],
    total: 0,
    pages: 1,
    categories: [],
    selected: null, // { service, providers }
    status: 'idle', // idle | loading | failed
    detailStatus: 'idle',
    error: null,
  },
  reducers: {
    clearSelected(state) {
      state.selected = null;
      state.detailStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.services;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchServiceById.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.detailStatus = 'idle';
        state.selected = action.payload;
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.selected = null;
        state.error = action.payload;
      });
  },
});

export const { clearSelected } = serviceSlice.actions;

export const selectServices = (state) => state.services.items;
export const selectServiceStatus = (state) => state.services.status;
export const selectServiceError = (state) => state.services.error;
export const selectCategories = (state) => state.services.categories;
export const selectSelectedService = (state) => state.services.selected;

export default serviceSlice.reducer;
