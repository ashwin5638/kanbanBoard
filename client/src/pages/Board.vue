<template>
  <div class="app-layout">
    <Navbar @toggle-activity="isActivityOpen = !isActivityOpen" />

    <div class="app-body">
      <Sidebar />

      <main class="board-main">
        <div class="board-top-bar">
          <div class="breadcrumbs">
            <button class="crumb-link" @click="goTo('/dashboard')" type="button">Dashboard</button>
            <span class="crumb-separator">/</span>
            <span class="crumb-current">{{ boardTitle }}</span>
          </div>

          <div class="board-top-actions">
            <button class="btn-back" @click="goTo('/dashboard')" type="button">
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <div class="kanban-container">
          <KanbanBoard :board-id="activeBoardId" />
        </div>
      </main>
    </div>

    <!-- Slide-over Activity Log -->
    <ActivityLog :is-open="isActivityOpen" @close="isActivityOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from '../routes';

import Navbar from '../components/Navbar/Navbar.vue';
import Sidebar from '../components/Sidebar/Sidebar.vue';
import KanbanBoard from '../components/KanbanBoard/KanbanBoard.vue';
import ActivityLog from '../components/ActivityLog/ActivityLog.vue';

const router = useRouter();
const route = useRoute();

const isActivityOpen = ref(false);

const activeBoardId = computed(() => {
  return route.value?.params?.boardId || '';
});

const boardTitle = computed(() => {
  return 'Kanban Workspace';
});

const goTo = (path) => {
  router.push(path);
};
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

.board-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
}

.board-top-bar {
  padding: 12px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.crumb-link {
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.crumb-link:hover {
  text-decoration: underline;
}

.crumb-separator {
  color: #cbd5e1;
}

.crumb-current {
  color: #0f172a;
  font-weight: 700;
}

.btn-back {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-back:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.kanban-container {
  flex: 1;
  overflow: hidden;
}
</style>

