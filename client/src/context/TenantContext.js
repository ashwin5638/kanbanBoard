import { reactive, computed, inject, provide } from 'vue';
import { api, storage } from '../services/api';
import socket from '../services/socket';

const TENANT_KEY = Symbol('TenantContext');

export function createTenantState() {
  const state = reactive({
    organization: null,
    tenants: [],
    activeTenantId: storage.getTenantId() || null,
    isLoading: false,
    error: null,
  });

  const activeTenant = computed(() => {
    if (!state.tenants.length) return null;
    return state.tenants.find((t) => t.id === state.activeTenantId) || state.tenants[0] || null;
  });

  const loadTenants = async () => {
    state.isLoading = true;
    state.error = null;
    try {
      const res = await api.tenants.list();
      state.tenants = res.data || [];

      // If activeTenantId is not set or not in list, pick the first tenant
      if (state.tenants.length > 0) {
        const exists = state.tenants.some((t) => t.id === state.activeTenantId);
        if (!exists) {
          state.activeTenantId = state.tenants[0].id;
          storage.setTenantId(state.activeTenantId);
        }
      }
      return state.tenants;
    } catch (err) {
      state.error = err.message || 'Failed to load tenants';
      console.error('Error loading tenants:', err);
      return [];
    } finally {
      state.isLoading = false;
    }
  };

  const loadOrganization = async () => {
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
      socket.logActivity({
        action: 'switched_workspace',
        details: `switched to workspace "${target.name}"`
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
    state,
    organization: computed(() => state.organization),
    tenants: computed(() => state.tenants),
    activeTenant,
    activeTenantId: computed(() => state.activeTenantId),
    isLoading: computed(() => state.isLoading),
    error: computed(() => state.error),
    loadTenants,
    loadOrganization,
    switchTenant,
    createTenant,
  };
}

let globalTenantInstance = null;

export function provideTenant() {
  if (!globalTenantInstance) {
    globalTenantInstance = createTenantState();
  }
  provide(TENANT_KEY, globalTenantInstance);
  return globalTenantInstance;
}

export function useTenant() {
  const context = inject(TENANT_KEY);
  if (!context) {
    if (!globalTenantInstance) {
      globalTenantInstance = createTenantState();
    }
    return globalTenantInstance;
  }
  return context;
}

