import { reactive, computed } from 'vue';
import { api, storage } from '../services/api';
import socket from '../services/socket';

// Simple reactive auth state
const state = reactive({
  user: storage.getUser(),
  token: storage.getToken(),
  isLoading: false,
  error: null,
});

if (state.user && state.token) {
  socket.connect(state.user, storage.getTenantId());
}

export function useAuth() {
  const login = async (email, password) => {
    state.isLoading = true;
    state.error = null;
    try {
      const res = await api.auth.login(email, password);
      const token = res.data?.token;
      const user = res.data?.user || { email, id: res.data?.userId };
      const tenantId = res.data?.tenantId;

      state.token = token;
      state.user = user;

      storage.setToken(token);
      storage.setUser(user);
      if (tenantId) {
        storage.setTenantId(tenantId);
      }

      socket.connect(user, tenantId);
      return { success: true, data: res.data };
    } catch (err) {
      state.error = err.message || 'Login failed';
      return { success: false, error: state.error };
    } finally {
      state.isLoading = false;
    }
  };

  const register = async (userData) => {
    state.isLoading = true;
    state.error = null;
    try {
      const res = await api.auth.register(userData);
      return { success: true, data: res.data };
    } catch (err) {
      state.error = err.message || 'Registration failed';
      return { success: false, error: state.error };
    } finally {
      state.isLoading = false;
    }
  };

  const logout = () => {
    state.user = null;
    state.token = null;
    state.error = null;
    storage.clearAll();
    socket.disconnect();
  };

  return {
    user: computed(() => state.user),
    token: computed(() => state.token),
    isLoading: computed(() => state.isLoading),
    error: computed(() => state.error),
    isAuthenticated: computed(() => !!state.token),
    isInitialized: computed(() => true),
    login,
    register,
    logout,
  };
}

export default useAuth;
