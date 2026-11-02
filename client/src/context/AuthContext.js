import { reactive, computed, inject, provide } from 'vue';
import { api, storage } from '../services/api';
import socket from '../services/socket';

const AUTH_KEY = Symbol('AuthContext');

export function createAuthState() {
  const state = reactive({
    user: storage.getUser(),
    token: storage.getToken(),
    isLoading: false,
    error: null,
  });

  const isAuthenticated = computed(() => !!state.token);

  if (state.user && state.token) {
    socket.connect(state.user);
  }

  const login = async (email, password) => {
    state.isLoading = true;
    state.error = null;
    try {
      const res = await api.auth.login(email, password);
      const token = res.data?.token;
      const user = res.data?.user || { email, id: res.data?.userId };

      state.token = token;
      state.user = user;

      storage.setToken(token);
      storage.setUser(user);

      socket.connect(user);
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

  const setUser = (user) => {
    state.user = user;
    storage.setUser(user);
  };

  return {
    state,
    user: computed(() => state.user),
    token: computed(() => state.token),
    isLoading: computed(() => state.isLoading),
    error: computed(() => state.error),
    isAuthenticated,
    login,
    register,
    logout,
    setUser,
  };
}

let globalAuthInstance = null;

export function provideAuth() {
  if (!globalAuthInstance) {
    globalAuthInstance = createAuthState();
  }
  provide(AUTH_KEY, globalAuthInstance);
  return globalAuthInstance;
}

export function useAuth() {
  const context = inject(AUTH_KEY);
  if (!context) {
    if (!globalAuthInstance) {
      globalAuthInstance = createAuthState();
    }
    return globalAuthInstance;
  }
  return context;
}

