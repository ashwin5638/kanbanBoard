<template>
  <div class="app-layout">
    <Navbar @toggle-activity="isActivityOpen = !isActivityOpen" />

    <div class="app-body">
      <Sidebar />

      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <div class="workspace-pill">
              <span class="icon">🏢</span>
              <span>{{ activeTenant?.name || 'Workspace' }}</span>
            </div>
            <h1>Welcome back, {{ user?.name || 'Teammate' }}!</h1>
            <p class="subtitle">Here is what is happening across your kanban workspace today.</p>
          </div>

          <button class="btn-create-board" @click="showCreateModal = true" type="button">
            + New Board
          </button>
        </div>

        <!-- Metric Stat Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon purple">▦</div>
            <div class="metric-info">
              <span class="metric-label">Active Boards</span>
              <span class="metric-value">{{ boards.length }}</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon blue">📋</div>
            <div class="metric-info">
              <span class="metric-label">Total Tasks</span>
              <span class="metric-value">{{ totalTasks }}</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon emerald">👥</div>
            <div class="metric-info">
              <span class="metric-label">Organization Team</span>
              <span class="metric-value">{{ organization?.users?.length || 1 }}</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon amber">⚡</div>
            <div class="metric-info">
              <span class="metric-label">Teammates Online</span>
              <span class="metric-value">{{ onlineUsers.length }}</span>
            </div>
          </div>
        </div>

        <!-- Boards Grid Section -->
        <div class="boards-section">
          <div class="section-title-row">
            <h2>Boards ({{ boards.length }})</h2>
            <span class="hint">Click any board to launch its collaborative Kanban canvas</span>
          </div>

          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <span>Loading workspace boards...</span>
          </div>

          <div v-else class="boards-grid">
            <!-- Create Board Card Trigger -->
            <div class="board-card create-card" @click="showCreateModal = true">
              <div class="plus-circle">+</div>
              <span class="create-title">Create New Board</span>
              <span class="create-sub">Add custom columns and drag-drop tasks</span>
            </div>

            <!-- Existing Board Cards -->
            <div
              v-for="b in boards"
              :key="b.id"
              class="board-card"
              @click="openBoard(b.id)"
            >
              <div class="card-header">
                <span class="board-badge">BOARD</span>
                <span class="task-count-pill">{{ getBoardTaskCount(b) }} tasks</span>
              </div>

              <h3 class="board-card-title">{{ b.title }}</h3>

              <div class="columns-mini-preview">
                <div
                  v-for="col in b.columns || []"
                  :key="col.id"
                  class="col-pill"
                >
                  <span class="col-pill-title">{{ col.title }}</span>
                  <span class="col-pill-badge">{{ col._count?.tasks || col.tasks?.length || 0 }}</span>
                </div>
              </div>

              <div class="card-footer">
                <span class="card-link">Open Board →</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Create Board Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create New Board</h3>
          <button class="close-btn" @click="showCreateModal = false">✕</button>
        </div>
        <div class="modal-body">
          <label>Board Title</label>
          <input
            v-model="newBoardTitle"
            placeholder="e.g. Sprint Backlog, Q3 Product Launch..."
            class="modal-input"
            @keyup.enter="handleCreateBoard"
            ref="modalInputRef"
          />
          <p class="modal-hint">A new board will automatically initialize with 'To Do', 'In Progress', and 'Done' columns.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showCreateModal = false">Cancel</button>
          <button
            class="btn-save"
            :disabled="!newBoardTitle.trim() || isCreating"
            @click="handleCreateBoard"
          >
            {{ isCreating ? 'Creating...' : 'Create Board' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Slide-over Activity Log -->
    <ActivityLog :is-open="isActivityOpen" @close="isActivityOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from '../routes';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../context/TenantContext';
import { usePresence } from '../hooks/usePresence';
import { api } from '../services/api';

import Navbar from '../components/Navbar/Navbar.vue';
import Sidebar from '../components/Sidebar/Sidebar.vue';
import ActivityLog from '../components/ActivityLog/ActivityLog.vue';

const router = useRouter();
const { user, isAuthenticated, isInitialized } = useAuth();
const { activeTenant, activeTenantId, organization, loadTenants, loadOrganization } = useTenant();
const { onlineUsers } = usePresence();

const boards = ref([]);
const isLoading = ref(false);
const isActivityOpen = ref(false);
const showCreateModal = ref(false);
const newBoardTitle = ref('');
const isCreating = ref(false);
const modalInputRef = ref(null);

const fetchBoards = async () => {
  if (!isInitialized.value || !isAuthenticated.value || !activeTenantId.value) return;
  isLoading.value = true;
  try {
    const res = await api.boards.list();
    boards.value = res.data || [];
  } catch (err) {
    console.error('Failed to load boards on dashboard:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  if (!isInitialized.value || !isAuthenticated.value) return;
  await loadTenants();
  await loadOrganization();
  await fetchBoards();
});

watch(
  [isInitialized, isAuthenticated, activeTenantId],
  ([initialized, authenticated, tenantId]) => {
    if (initialized && authenticated && tenantId) {
      fetchBoards();
    }
  }
);

watch(showCreateModal, (open) => {
  if (open) {
    newBoardTitle.value = '';
    nextTick(() => modalInputRef.value?.focus());
  }
});

const openBoard = (boardId) => {
  router.push(`/board/${boardId}`);
};

const handleCreateBoard = async () => {
  if (!newBoardTitle.value.trim() || isCreating.value) return;
  isCreating.value = true;
  try {
    const res = await api.boards.create(newBoardTitle.value.trim());
    if (res.data) {
      showCreateModal.value = false;
      openBoard(res.data.id);
    }
  } catch (err) {
    console.error('Failed to create board:', err);
  } finally {
    isCreating.value = false;
  }
};

const getBoardTaskCount = (b) => {
  if (!b.columns) return 0;
  return b.columns.reduce((sum, col) => sum + (col._count?.tasks || col.tasks?.length || 0), 0);
};

const totalTasks = computed(() => {
  return boards.value.reduce((acc, b) => acc + getBoardTaskCount(b), 0);
});
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px 40px;
  background: #f8fafc;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;
}

.workspace-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e0e7ff;
  color: #4338ca;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #64748b;
}

.btn-create-board {
  padding: 10px 18px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
  transition: all 0.15s ease;
}

.btn-create-board:hover {
  background: #4338ca;
  transform: translateY(-1px);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 36px;
}

.metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.metric-icon.purple { background: #f5f3ff; color: #7c3aed; }
.metric-icon.blue { background: #eff6ff; color: #2563eb; }
.metric-icon.emerald { background: #ecfdf5; color: #059669; }
.metric-icon.amber { background: #fffbeb; color: #d97706; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.boards-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.section-title-row h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.hint {
  font-size: 13px;
  color: #94a3b8;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.board-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.board-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.board-badge {
  font-size: 10px;
  font-weight: 800;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 6px;
  border-radius: 4px;
}

.task-count-pill {
  font-size: 11px;
  color: #4f46e5;
  font-weight: 700;
}

.board-card-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.columns-mini-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}

.col-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #475569;
}

.col-pill-badge {
  font-weight: 700;
  color: #6366f1;
}

.card-footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.card-link {
  font-size: 12px;
  font-weight: 700;
  color: #4f46e5;
}

.create-card {
  border: 2px dashed #cbd5e1;
  background: rgba(241, 245, 249, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 180px;
}

.create-card:hover {
  background: #ffffff;
  border-color: #6366f1;
}

.plus-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.create-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.create-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-body label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.modal-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.modal-input:focus {
  border-color: #6366f1;
}

.modal-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.modal-footer {
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 8px 14px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-save {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
