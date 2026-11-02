<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-top">
      <button class="nav-btn" :class="{ active: currentPath === '/dashboard' }" @click="goTo('/dashboard')">
        <span class="icon">📊</span>
        <span v-if="!isCollapsed" class="label">Dashboard</span>
      </button>
    </div>

    <div class="sidebar-section">
      <div v-if="!isCollapsed" class="section-header">
        <span class="section-title">Boards in Workspace</span>
        <button class="add-board-btn" @click="showNewBoardInput = true" title="Create New Board">+</button>
      </div>

      <!-- Quick board create input -->
      <div v-if="showNewBoardInput && !isCollapsed" class="quick-add-board">
        <input
          v-model="newBoardTitle"
          placeholder="Board name..."
          class="board-input"
          @keyup.enter="handleCreateBoard"
          ref="boardInputRef"
        />
        <div class="quick-add-actions">
          <button class="btn-xs cancel" @click="showNewBoardInput = false">✕</button>
          <button class="btn-xs save" :disabled="!newBoardTitle.trim() || isCreating" @click="handleCreateBoard">✓</button>
        </div>
      </div>

      <div class="boards-list">
        <div v-if="isLoading" class="loading-state">
          <span v-if="!isCollapsed">Loading boards...</span>
        </div>

        <div v-else-if="boards.length === 0 && !isCollapsed" class="empty-boards">
          <span>No boards yet</span>
          <button class="create-first-btn" @click="showNewBoardInput = true">+ Create one</button>
        </div>

        <button
          v-for="b in boards"
          :key="b.id"
          class="board-nav-item"
          :class="{ active: currentPath === `/board/${b.id}` }"
          @click="goTo(`/board/${b.id}`)"
          :title="b.title"
        >
          <span class="board-bullet">▦</span>
          <span v-if="!isCollapsed" class="board-title">{{ b.title }}</span>
          <span v-if="!isCollapsed && b.columns" class="task-count">
            {{ getTotalTasks(b) }}
          </span>
        </button>
      </div>
    </div>

    <div class="sidebar-footer">
      <button class="collapse-toggle" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
        <span>{{ isCollapsed ? '→' : '←' }}</span>
        <span v-if="!isCollapsed" class="label">Collapse sidebar</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from '../../routes';
import { useTenant } from '../../context/TenantContext';
import { api, storage } from '../../services/api';
import socket from '../../services/socket';

const router = useRouter();
const { activeTenantId } = useTenant();

const boards = ref([]);
const isLoading = ref(false);
const isCollapsed = ref(false);
const showNewBoardInput = ref(false);
const newBoardTitle = ref('');
const isCreating = ref(false);
const boardInputRef = ref(null);

const currentPath = computed(() => router.currentPath.value);

const fetchBoards = async () => {
  if (!storage.getToken() || !activeTenantId.value) return;
  isLoading.value = true;
  try {
    const res = await api.boards.list();
    boards.value = res.data || [];
  } catch (err) {
    console.error('Failed to load boards in sidebar:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchBoards();
});

watch(activeTenantId, () => {
  fetchBoards();
});

watch(showNewBoardInput, (open) => {
  if (open) {
    nextTick(() => boardInputRef.value?.focus());
  }
});

const goTo = (path) => {
  router.push(path);
};

const handleCreateBoard = async () => {
  if (!newBoardTitle.value.trim() || isCreating.value) return;
  isCreating.value = true;
  try {
    const res = await api.boards.create(newBoardTitle.value.trim());
    if (res.data) {
      boards.value.unshift(res.data);
      newBoardTitle.value = '';
      showNewBoardInput.value = false;
      socket.logActivity({
        action: 'created_board',
        details: `created board "${res.data.title}"`
      });
      goTo(`/board/${res.data.id}`);
    }
  } catch (err) {
    console.error('Failed to create board:', err);
  } finally {
    isCreating.value = false;
  }
};

const getTotalTasks = (b) => {
  if (!b.columns) return 0;
  return b.columns.reduce((sum, col) => sum + (col._count?.tasks || col.tasks?.length || 0), 0);
};
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-top {
  padding: 12px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.nav-btn.active {
  background: #e0e7ff;
  color: #4338ca;
}

.sidebar-section {
  flex: 1;
  padding: 8px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px 8px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
}

.add-board-btn {
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: #475569;
  font-size: 14px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-board-btn:hover {
  background: #ffffff;
  color: #0f172a;
  border-color: #94a3b8;
}

.quick-add-board {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.board-input {
  flex: 1;
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}

.board-input:focus {
  border-color: #6366f1;
}

.quick-add-actions {
  display: flex;
  gap: 2px;
}

.btn-xs {
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-xs.save {
  background: #10b981;
  color: white;
}

.btn-xs.cancel {
  background: #e2e8f0;
  color: #64748b;
}

.boards-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.loading-state, .empty-boards {
  padding: 12px 6px;
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.create-first-btn {
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  padding: 0;
}

.board-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.board-nav-item:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.board-nav-item.active {
  background: #ffffff;
  color: #4338ca;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.board-bullet {
  font-size: 14px;
  color: #818cf8;
}

.board-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-count {
  font-size: 11px;
  background: #e2e8f0;
  padding: 1px 6px;
  border-radius: 10px;
  color: #64748b;
}

.sidebar-footer {
  padding: 10px 12px;
  border-top: 1px solid #e2e8f0;
}

.collapse-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
}

.collapse-toggle:hover {
  background: #e2e8f0;
  color: #0f172a;
}
</style>

