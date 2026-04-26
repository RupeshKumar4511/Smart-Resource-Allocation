import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../app/api';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      return res.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Not authenticated');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    // ✅ If no flag exists, skip loading — user is definitely not logged in
    loading: localStorage.getItem('isLoggedIn') === 'true',
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.loading = false;
      localStorage.setItem('isLoggedIn', 'true'); // ✅ set on manual user set
    },
    clearUser(state) {
      state.user = null;
      state.loading = false;
      localStorage.removeItem('isLoggedIn'); // ✅ clear on manual clear
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMe
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        localStorage.setItem('isLoggedIn', 'true'); // ✅ confirm session is alive
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.user = null;
        state.loading = false;
        state.error = action.payload;
        localStorage.removeItem('isLoggedIn'); // ✅ token expired or invalid
      })

      // logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.error = null;
        localStorage.removeItem('isLoggedIn'); // ✅ clear on logout
      })
      .addCase(logout.rejected, (state) => {
        // ✅ Even if logout API fails, clear locally
        // so user isn't stuck in a logged-in UI state
        state.user = null;
        state.loading = false;
        localStorage.removeItem('isLoggedIn');
      });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;