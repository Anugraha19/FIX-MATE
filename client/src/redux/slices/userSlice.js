// userSlice - REDUX state for the logged-in user's profile page (save profile, change password).
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi, providersApi, getErrorMessage } from '../../services/api';
import { setUser } from './authSlice';

// Saves name/phone/address/city; providers also save experience, skills, location and status.
export const saveProfile = createAsyncThunk('user/saveProfile', async ({ role, values }, { dispatch, rejectWithValue }) => {
  try {
    if (role === 'provider') {
      await providersApi.update('me', values); // updates the user fields AND the provider fields
      const data = await usersApi.getProfile();
      dispatch(setUser(data.user)); // keep the logged-in user in sync
      return data.user;
    }
    const data = await usersApi.updateProfile(values);
    dispatch(setUser(data.user));
    return data.user;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const changePassword = createAsyncThunk('user/changePassword', async (values, { rejectWithValue }) => {
  try {
    const data = await usersApi.changePassword(values);
    return data.message;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: { status: 'idle', error: null, message: null },
  reducers: {
    clearUserMessage(state) {
      state.error = null;
      state.message = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.message = null;
      })
      .addCase(saveProfile.fulfilled, (state) => {
        state.status = 'idle';
        state.message = 'Profile saved';
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.message = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.status = 'idle';
        state.message = action.payload;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearUserMessage } = userSlice.actions;
export const selectUserState = (state) => state.user;

export default userSlice.reducer;
