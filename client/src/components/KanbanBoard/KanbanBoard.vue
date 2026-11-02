<template>
  <div class="kanban-wrapper">
    <!-- Top toolbar: Filters, search & board stats -->
    <div class="kanban-toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            placeholder="Search tasks..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">✕</button>
        </div>

        <div class="filter-box">
          <label>Assignee:</label>
          <select v-model="selectedAssignee" class="filter-select">
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option
              v-for="user in organization?.users || []"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="toolbar-right">
        <span class="board-stats">
          {{ totalVisibleTasks }} tasks across {{ columns.length }} columns
        </span>
      </div>
    </div>

    <!-- Board columns area -->
    <div class="board-canvas">
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading board...</span>
      </div>

      <div v-else-if="error" class="error-banner">
        <span>⚠️ {{ error }}</span>
        <button class="retry-btn" @click="loadBoard(boardId)">Retry</button>
      </div>

      <div v-else class="columns-track">
        <BoardColumn
          v-for="column in filteredColumns"
          :key="column.id"
          :column="column"
          :all-columns="columns"
          @update-column="({ columnId, title }) => updateColumn(columnId, { title })"
          @delete-column="(id) => deleteColumn(id)"
          @add-task="({ columnId, title, description }) => addTask(columnId, title, description)"
          @select-task="(task) => openTaskDetails(task)"
          @task-drop-on-column="({ taskId, targetColumnId }) => moveTask(taskId, targetColumnId)"
          @quick-move-task="({ taskId, targetColumnId }) => moveTask(taskId, targetColumnId)"
        />

        <!-- Add New Column Component -->
        <div class="new-column-wrap">
          <div v-if="isAddingColumn" class="new-column-form">
            <input
              v-model="newColTitle"
              placeholder="Column name (e.g. In Review)..."
              class="new-col-input"
              @keyup.enter="handleCreateColumn"
              ref="colInputRef"
            />
            <div class="new-col-actions">
              <button class="btn-cancel" @click="isAddingColumn = false" type="button">Cancel</button>
              <button
                class="btn-save"
                :disabled="!newColTitle.trim() || isCreatingCol"
                @click="handleCreateColumn"
                type="button"
              >
                {{ isCreatingCol ? 'Adding...' : 'Add Column' }}
              </button>
            </div>
          </div>

          <button v-else class="add-column-btn" @click="startAddColumn" type="button">
            <span class="plus">+</span> Add another column
          </button>
        </div>
      </div>
    </div>

    <!-- Task Details Modal -->
    <TaskDetails
      :is-open="isDetailsOpen"
      :task="selectedTask"
      :columns="columns"
      @close="closeTaskDetails"
      @update="({ taskId, updates }) => updateTask(taskId, updates)"
      @delete="(taskId) => deleteTask(taskId)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useKanban } from '../../hooks/useKanban';
import { useTenant } from '../../context/TenantContext';
import BoardColumn from '../BoardColumn/BoardColumn.vue';
import TaskDetails from '../TaskDetails/TaskDetails.vue';

const props = defineProps({
  boardId: { type: String, required: true }
});

const { organization } = useTenant();

const {
  board,
  columns,
  filteredColumns,
  isLoading,
  error,
  searchQuery,
  selectedAssignee,
  selectedTask,
  isDetailsOpen,
  loadBoard,
  addColumn,
  updateColumn,
  deleteColumn,
  addTask,
  updateTask,
  moveTask,
  deleteTask,
  openTaskDetails,
  closeTaskDetails,
} = useKanban(computed(() => props.boardId));

const isAddingColumn = ref(false);
const newColTitle = ref('');
const isCreatingCol = ref(false);
const colInputRef = ref(null);

const totalVisibleTasks = computed(() => {
  return filteredColumns.value.reduce((acc, col) => acc + (col.tasks?.length || 0), 0);
});

onMounted(() => {
  if (props.boardId) {
    loadBoard(props.boardId);
  }
});

watch(() => props.boardId, (newId) => {
  if (newId) {
    loadBoard(newId);
  }
});

const startAddColumn = () => {
  isAddingColumn.value = true;
  newColTitle.value = '';
  nextTick(() => colInputRef.value?.focus());
};

const handleCreateColumn = async () => {
  if (!newColTitle.value.trim() || isCreatingCol.value) return;
  isCreatingCol.value = true;
  try {
    await addColumn(newColTitle.value.trim());
    isAddingColumn.value = false;
    newColTitle.value = '';
  } finally {
    isCreatingCol.value = false;
  }
};
</script>

<style scoped>
.kanban-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.kanban-toolbar {
  padding: 12px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 240px;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 6px 28px 6px 30px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}

.search-input:focus {
  border-color: #6366f1;
}

.clear-search {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
}

.filter-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-box label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.filter-select {
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  outline: none;
  cursor: pointer;
}

.board-stats {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.board-canvas {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 20px 24px;
  background: #f8fafc;
  position: relative;
}

.columns-track {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-height: 100%;
}

.new-column-wrap {
  width: 280px;
  min-width: 280px;
}

.add-column-btn {
  width: 100%;
  padding: 12px 16px;
  background: rgba(226, 232, 240, 0.6);
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.add-column-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.plus {
  font-size: 16px;
  font-weight: 700;
}

.new-column-form {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-col-input {
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  box-sizing: border-box;
}

.new-col-input:focus {
  border-color: #6366f1;
}

.new-col-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.btn-cancel {
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  padding: 4px 8px;
  cursor: pointer;
}

.btn-save {
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #64748b;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 500px;
  margin: 20px auto;
}

.retry-btn {
  background: #e11d48;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

