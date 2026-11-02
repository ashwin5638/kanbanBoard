<template>
  <div v-if="isOpen" class="activity-overlay" @click.self="$emit('close')">
    <div class="activity-panel">
      <div class="activity-header">
        <div class="title-wrap">
          <span class="icon">⚡</span>
          <h3>Live Activity Stream</h3>
        </div>
        <button class="close-btn" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div class="activity-filters">
        <span class="badge">{{ activities.length }} events recorded</span>
      </div>

      <div class="activity-list">
        <div v-if="activities.length === 0" class="empty-state">
          <p>No recent activity. Actions on tasks, columns, and boards will appear here live!</p>
        </div>

        <div
          v-for="item in activities"
          :key="item.id"
          class="activity-item"
        >
          <div class="activity-icon-bubble" :class="getActionClass(item.action)">
            {{ getActionIcon(item.action) }}
          </div>
          <div class="activity-content">
            <p class="activity-text">
              <strong>{{ item.userName }}</strong> {{ item.details }}
            </p>
            <span class="activity-time">{{ formatTime(item.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePresence } from '../../hooks/usePresence';

defineProps({
  isOpen: { type: Boolean, default: false }
});

defineEmits(['close']);

const { activities } = usePresence();

const getActionIcon = (action) => {
  switch (action) {
    case 'moved_task': return '↔';
    case 'created_task': return '+';
    case 'updated_task': return '✎';
    case 'deleted_task': return '✕';
    case 'created_column': return '▥';
    case 'switched_workspace': return '🏢';
    case 'viewed_board': return '👁';
    default: return '•';
  }
};

const getActionClass = (action) => {
  if (action?.includes('delete')) return 'danger';
  if (action?.includes('created')) return 'success';
  if (action?.includes('move')) return 'info';
  return 'default';
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.activity-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.15s ease-out;
}

.activity-panel {
  width: 380px;
  max-width: 90vw;
  height: 100%;
  background: #ffffff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.activity-header {
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-wrap h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.activity-filters {
  padding: 10px 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 12px;
}

.activity-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 40px 10px;
  font-size: 13px;
}

.activity-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.activity-icon-bubble {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.activity-icon-bubble.info {
  background: #e0e7ff;
  color: #4f46e5;
}

.activity-icon-bubble.success {
  background: #dcfce7;
  color: #16a34a;
}

.activity-icon-bubble.danger {
  background: #fee2e2;
  color: #dc2626;
}

.activity-icon-bubble.default {
  background: #f1f5f9;
  color: #475569;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0;
  font-size: 13px;
  color: #1e293b;
  line-height: 1.4;
}

.activity-text strong {
  color: #0f172a;
}

.activity-time {
  font-size: 11px;
  color: #94a3b8;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

