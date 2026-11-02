import { reactive, computed } from 'vue';
import { api, storage } from '../services/api';
import socket from '../services/socket';

// Simple reactive tenant state
const state = reactive({
  organization: null,
  tenants: [],
  activeTenantId: storage.getTenantId() || null,
  isLoading: false,
  error: null,
});

export function useTenant() {
  const activeTenant = computed(() => {
    if (!state.tenants.length) return null;
    return state.tenants.find((t) => t.id === state.activeTenantId) || state.tenants[0] || null;
  });

  const loadTenants = async () => {
    const token = storage.getToken();
    if (!token) {
      state.tenants = [];
      return [];
    }

    state.isLoading = true;
    try {
      const res = await api.tenants.list();
      state.tenants = res.data || [];

      if (state.tenants.length > 0) {
        const exists = state.tenants.some((t) => t.id === state.activeTenantId);
        if (!exists) {
          state.activeTenantId = state.tenants[0].id;
          storage.setTenantId(state.activeTenantId);
          socket.joinTenant(state.activeTenantId);
        }
      }
      return state.tenants;
    } catch (err) {
      console.error('Error loading tenants:', err);
      return [];
    } finally {
      state.isLoading = false;
    }
  };

  const loadOrganization = async () => {
    const token = storage.getToken();
    if (!token) {
      state.organization = null;
      return null;
    }

    try {
      const res = await api.organizations.getDetails();
      state.organization = res.data || null;
      return state.organization;
    } catch (err) {
      console.error('Error loading organization:', err);
      return null;
    }
  };

  const switchTenant = (tenantId) => {
    const target = state.tenants.find((t) => t.id === tenantId);
    if (target) {
      state.activeTenantId = target.id;
      storage.setTenantId(target.id);
      socket.joinTenant(target.id);
      socket.logActivity({
        action: 'switched_workspace',
        details: `switched to workspace "${target.name}"`,
      });
    }
  };

  const createTenant = async (name) => {
    state.isLoading = true;
    try {
      const res = await api.tenants.create(name);
      const newTenant = res.data;
      if (newTenant) {
        state.tenants.push(newTenant);
        switchTenant(newTenant.id);
      }
      return { success: true, data: newTenant };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to create workspace' };
    } finally {
      state.isLoading = false;
    }
  };

  return {
    organization: computed(() => state.organization),
    tenants: computed(() => state.tenants),
    activeTenant,
    activeTenantId: computed(() => state.activeTenantId),
    isLoading: computed(() => state.isLoading),
    loadTenants,
    loadOrganization,
    switchTenant,
    createTenant,
  };
}

export default useTenant;
