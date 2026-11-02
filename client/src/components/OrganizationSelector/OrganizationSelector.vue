<template>
  <div class="org-selector">
    <button class="org-trigger" @click="showMembers = true" type="button" :title="'View ' + (organization?.name || 'Organization') + ' team details'">
      <div class="org-avatar">
        {{ getInitials(organization?.name || 'Kanban Org') }}
      </div>
      <div class="org-info">
        <span class="org-name">{{ organization?.name || 'Organization' }}</span>
        <span class="org-members-count">{{ organization?.users?.length || 1 }} team members</span>
      </div>
    </button>

    <!-- Organization Team Members Modal -->
    <div v-if="showMembers" class="modal-overlay" @click.self="showMembers = false">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>{{ organization?.name || 'Organization' }}</h3>
            <p class="subtitle">Organization details & team directory</p>
          </div>
          <button class="close-btn" @click="showMembers = false" type="button">✕</button>
        </div>

        <div class="modal-body">
          <div class="stat-grid">
            <div class="stat-card">
              <span class="stat-val">{{ organization?.tenants?.length || 0 }}</span>
              <span class="stat-label">Workspaces</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">{{ organization?.users?.length || 0 }}</span>
              <span class="stat-label">Active Members</span>
            </div>
          </div>

          <div class="members-section">
            <h4>Team Members</h4>
            <div class="members-list">
              <div
                v-for="u in organization?.users || []"
                :key="u.id"
                class="member-row"
              >
                <div class="member-avatar">
                  {{ getInitials(u.name) }}
                </div>
                <div class="member-details">
                  <span class="member-name">{{ u.name }}</span>
                  <span class="member-email">{{ u.email }}</span>
                </div>
                <span class="role-badge" :class="u.role.toLowerCase()">
                  {{ u.role }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" @click="showMembers = false" type="button">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTenant } from '../../context/TenantContext';

const { organization, loadOrganization } = useTenant();
const showMembers = ref(false);

onMounted(() => {
  loadOrganization();
});

const getInitials = (name) => {
  if (!name) return 'O';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
};
</script>

<style scoped>
.org-selector {
  display: inline-block;
}

.org-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.org-trigger:hover {
  background: #f1f5f9;
}

.org-avatar {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.org-info {
  display: flex;
  flex-direction: column;
}

.org-name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.org-members-count {
  font-size: 11px;
  color: #64748b;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;
}

.modal-card {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
  padding: 2px 6px;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 20px 24px;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.members-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #334155;
}

.members-list {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  background: #f8fafc;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.member-email {
  font-size: 11px;
  color: #64748b;
}

.role-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 10px;
}

.role-badge.admin {
  background: #fef3c7;
  color: #b45309;
}

.role-badge.member {
  background: #e0e7ff;
  color: #4338ca;
}

.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

.btn-primary {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>

