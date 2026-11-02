<template>
  <div class="presence-container">
    <div class="presence-avatars">
      <div
        v-for="user in visibleUsers"
        :key="user.id"
        class="presence-avatar-wrap"
        :title="`${user.name} (${user.role}) - ${user.lastActive || user.status}`"
      >
        <div class="presence-avatar" :class="[user.status, { 'is-self': user.isSelf }]">
          {{ getInitials(user.name) }}
          <span class="status-indicator" :class="user.status"></span>
        </div>
      </div>

      <div v-if="overflowCount > 0" class="presence-avatar overflow" :title="`${overflowCount} more members online`">
        +{{ overflowCount }}
      </div>
    </div>
    <span class="presence-label">
      <span class="live-dot"></span>
      {{ onlineCount }} online
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePresence } from '../../hooks/usePresence';

const { onlineUsers } = usePresence();

const visibleUsers = computed(() => onlineUsers.value.slice(0, 4));
const overflowCount = computed(() => Math.max(0, onlineUsers.value.length - 4));
const onlineCount = computed(() => onlineUsers.value.filter(u => u.status === 'online').length);

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
};
</script>

<style scoped>
.presence-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.presence-avatars {
  display: flex;
  align-items: center;
}

.presence-avatar-wrap {
  margin-left: -8px;
  position: relative;
  transition: transform 0.2s ease, z-index 0.2s;
}

.presence-avatar-wrap:first-child {
  margin-left: 0;
}

.presence-avatar-wrap:hover {
  transform: translateY(-2px);
  z-index: 10;
}

.presence-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  position: relative;
}

.presence-avatar.is-self {
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
}

.presence-avatar.overflow {
  background: #64748b;
  margin-left: -8px;
}

.status-indicator {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid #ffffff;
}

.status-indicator.online {
  background-color: #10b981;
}

.status-indicator.idle {
  background-color: #f59e0b;
}

.presence-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}
</style>

