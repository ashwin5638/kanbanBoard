<template>
  <div class="tenant-switcher" ref="switcherRef">
    <button class="switcher-trigger" @click="isOpen = !isOpen" type="button">
      <div class="tenant-icon">🏢</div>
      <div class="tenant-meta">
        <span class="tenant-label">Workspace</span>
        <span class="tenant-name">{{ activeTenant?.name || 'Select Workspace' }}</span>
      </div>
      <span class="arrow" :class="{ open: isOpen }">▼</span>
    </button>

    <div v-if="isOpen" class="dropdown-menu">
      <div class="dropdown-header">
        <span>Workspaces ({{ tenants.length }})</span>
      </div>

      <div class="tenants-list">
        <button
          v-for="t in tenants"
          :key="t.id"
          class="tenant-item"
          :class="{ active: t.id === activeTenant?.id }"
          @click="selectTenant(t.id)"
          type="button"
        >
          <span class="tenant-item-icon">⚡</span>
          <div class="tenant-item-info">
            <span class="item-name">{{ t.name }}</span>
            <span class="item-count">{{ t._count?.boards || 0 }} boards</span>
          </div>
          <span v-if="t.id === activeTenant?.id" class="active-check">✓</span>
        </button>
      </div>

      <div class="dropdown-divider"></div>

      <div v-if="isCreating" class="create-tenant-box">
        <input
          v-model="newTenantName"
          placeholder="New workspace name..."
          class="tenant-input"
          @keyup.enter="handleCreateTenant"
          ref="inputRef"
        />
        <div class="create-actions">
          <button class="btn-cancel" @click="isCreating = false" type="button">Cancel</button>
          <button class="btn-save" :disabled="!newTenantName.trim() || isSubmitting" @click="handleCreateTenant" type="button">
            {{ isSubmitting ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>

      <button v-else class="create-trigger" @click="startCreate" type="button">
        <span class="plus-icon">+</span> Create New Workspace
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useTenant } from '../../context/TenantContext';

const { tenants, activeTenant, switchTenant, createTenant } = useTenant();

const isOpen = ref(false);
const isCreating = ref(false);
const newTenantName = ref('');
const isSubmitting = ref(false);
const switcherRef = ref(null);
const inputRef = ref(null);

const selectTenant = (id) => {
  switchTenant(id);
  isOpen.value = false;
};

const startCreate = () => {
  isCreating.value = true;
  newTenantName.value = '';
  nextTick(() => inputRef.value?.focus());
};

const handleCreateTenant = async () => {
  if (!newTenantName.value.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await createTenant(newTenantName.value.trim());
    if (res.success) {
      isCreating.value = false;
      newTenantName.value = '';
      isOpen.value = false;
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleClickOutside = (e) => {
  if (switcherRef.value && !switcherRef.value.contains(e.target)) {
    isOpen.value = false;
    isCreating.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.tenant-switcher {
  position: relative;
  display: inline-block;
}

.switcher-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.switcher-trigger:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.tenant-icon {
  font-size: 16px;
}

.tenant-meta {
  display: flex;
  flex-direction: column;
}

.tenant-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.tenant-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow {
  font-size: 10px;
  color: #64748b;
  transition: transform 0.2s ease;
  margin-left: 4px;
}

.arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 260px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  z-index: 100;
  overflow: hidden;
  animation: dropIn 0.15s ease-out;
}

.dropdown-header {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.tenants-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tenant-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.tenant-item:hover {
  background: #f1f5f9;
}

.tenant-item.active {
  background: #eef2ff;
}

.tenant-item-icon {
  font-size: 14px;
  color: #6366f1;
}

.tenant-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.item-count {
  font-size: 11px;
  color: #94a3b8;
}

.active-check {
  color: #4f46e5;
  font-weight: 700;
  font-size: 14px;
}

.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
}

.create-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: #4f46e5;
  cursor: pointer;
  transition: background 0.15s ease;
}

.create-trigger:hover {
  background: #f8fafc;
}

.plus-icon {
  font-size: 16px;
  font-weight: 700;
}

.create-tenant-box {
  padding: 10px 12px;
  background: #f8fafc;
}

.tenant-input {
  width: 100%;
  padding: 7px 10px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  box-sizing: border-box;
}

.tenant-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
}

.btn-cancel {
  padding: 4px 8px;
  font-size: 12px;
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: #475569;
  cursor: pointer;
}

.btn-save {
  padding: 4px 10px;
  font-size: 12px;
  background: #4f46e5;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes dropIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

