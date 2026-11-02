<template>
  <header class="navbar">
    <div class="navbar-left">
      <button class="brand-link" @click="goHome" type="button">
        <span class="brand-icon">⚡</span>
        <span class="brand-title">KanbanFlow</span>
      </button>

      <div class="nav-divider"></div>

      <OrganizationSelector />

      <div class="nav-divider"></div>

      <TenantSwitcher />
    </div>

    <div class="navbar-right">
      <PresenceIndicator />

      <button
        class="activity-toggle-btn"
        @click="$emit('toggle-activity')"
        title="View Activity Stream"
        type="button"
      >
        <span class="icon">⚡</span>
        <span class="btn-text">Activity</span>
      </button>

      <div class="nav-divider"></div>

      <div class="user-profile">
        <div class="user-avatar" :title="user?.name || user?.email">
          {{ getInitials(user?.name || user?.email) }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ user?.name || 'User' }}</span>
          <span class="user-role">{{ user?.role || 'MEMBER' }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout" title="Logout" type="button">
          🚪
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from '../../routes';
import TenantSwitcher from '../TenantSwitcher/TenantSwitcher.vue';
import OrganizationSelector from '../OrganizationSelector/OrganizationSelector.vue';
import PresenceIndicator from '../PresenceIndicator/PresenceIndicator.vue';

defineEmits(['toggle-activity']);

const { user, logout } = useAuth();
const router = useRouter();

const goHome = () => {
  router.push('/dashboard');
};

const handleLogout = () => {
  logout();
  router.push('/login');
};

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
};
</script>

<style scoped>
.navbar {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.brand-icon {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
}

.brand-title {
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #0f172a 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-divider {
  width: 1px;
  height: 24px;
  background-color: #e2e8f0;
}

.activity-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.activity-toggle-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.user-role {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
}

.logout-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.logout-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}
</style>

