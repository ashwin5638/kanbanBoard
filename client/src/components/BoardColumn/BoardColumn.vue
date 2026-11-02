<template>
  <div
    class="board-column"
    :class="{ 'drop-active': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragenter.prevent="isDragOver = true"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div class="column-header">
      <div class="title-area">
        <input
          v-if="isEditingTitle"
          v-model="editedTitle"
          class="column-title-input"
          @blur="saveTitle"
          @keyup.enter="saveTitle"
          ref="titleInputRef"
        />
        <h3 v-else class="column-title" @click="startEditTitle">
          {{ column.title }}
        </h3>
        <span class="task-badge">{{ (column.tasks || []).length }}</span>
      </div>

      <div class="col-actions">
        <button class="action-dots" @click="showMenu = !showMenu" title="Column options" type="button">⋮</button>
        <div v-if="showMenu" class="menu-popover">
          <button class="menu-item" @click="startEditTitle" type="button">✎ Rename</button>
          <button class="menu-item danger" @click="handleDeleteColumn" type="button">🗑 Delete Column</button>
        </div>
      </div>
    </div>

    <!-- Tasks List -->
    <div class="column-tasks">
      <TaskCard
        v-for="task in column.tasks || []"
        :key="task.id"
        :task="task"
        :available-columns="allColumns"
        @select="$emit('select-task', task)"
        @drag-start="$emit('task-drag-start', task)"
        @drag-end="$emit('task-drag-end')"
        @quick-move="(payload) => $emit('quick-move-task', payload)"
      />

      <div v-if="(column.tasks || []).length === 0 && !isAddingTask" class="empty-dropzone">
        Drop cards here
      </div>
    </div>

    <!-- Add Task Section -->
    <div class="column-footer">
      <div v-if="isAddingTask" class="add-task-form">
        <input
          v-model="newTaskTitle"
          placeholder="Card title..."
          class="new-task-input"
          @keyup.enter="handleCreateTask"
          ref="taskInputRef"
        />
        <textarea
          v-model="newTaskDesc"
          placeholder="Optional description..."
          class="new-task-textarea"
          rows="2"
        ></textarea>
        <div class="form-actions">
          <button class="btn-cancel" @click="cancelAddTask" type="button">Cancel</button>
          <button
            class="btn-submit"
            :disabled="!newTaskTitle.trim() || isSubmitting"
            @click="handleCreateTask"
            type="button"
          >
            {{ isSubmitting ? 'Adding...' : 'Add Card' }}
          </button>
        </div>
      </div>

      <button v-else class="add-card-btn" @click="startAddTask" type="button">
        + Add a card
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import TaskCard from '../TaskCard/TaskCard.vue';

const props = defineProps({
  column: { type: Object, required: true },
  allColumns: { type: Array, default: () => [] }
});

const emit = defineEmits([
  'update-column',
  'delete-column',
  'add-task',
  'select-task',
  'task-drag-start',
  'task-drag-end',
  'task-drop-on-column',
  'quick-move-task'
]);

const isDragOver = ref(false);
const isEditingTitle = ref(false);
const editedTitle = ref(props.column.title);
const titleInputRef = ref(null);
const showMenu = ref(false);

const isAddingTask = ref(false);
const newTaskTitle = ref('');
const newTaskDesc = ref('');
const isSubmitting = ref(false);
const taskInputRef = ref(null);

const onDragOver = (e) => {
  e.dataTransfer.dropEffect = 'move';
  isDragOver.value = true;
};

const onDragLeave = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragOver.value = false;
  }
};

const onDrop = (e) => {
  isDragOver.value = false;
  try {
    const dataStr = e.dataTransfer.getData('text/plain');
    if (dataStr) {
      const data = JSON.parse(dataStr);
      if (data.taskId) {
        emit('task-drop-on-column', { taskId: data.taskId, targetColumnId: props.column.id });
      }
    }
  } catch (err) {
    console.error('Failed to parse drag drop payload:', err);
  }
};

const startEditTitle = () => {
  showMenu.value = false;
  isEditingTitle.value = true;
  editedTitle.value = props.column.title;
  nextTick(() => titleInputRef.value?.focus());
};

const saveTitle = () => {
  isEditingTitle.value = false;
  if (editedTitle.value.trim() && editedTitle.value !== props.column.title) {
    emit('update-column', { columnId: props.column.id, title: editedTitle.value.trim() });
  }
};

const handleDeleteColumn = () => {
  showMenu.value = false;
  if (confirm(`Delete column "${props.column.title}" and its tasks?`)) {
    emit('delete-column', props.column.id);
  }
};

const startAddTask = () => {
  isAddingTask.value = true;
  newTaskTitle.value = '';
  newTaskDesc.value = '';
  nextTick(() => taskInputRef.value?.focus());
};

const cancelAddTask = () => {
  isAddingTask.value = false;
  newTaskTitle.value = '';
  newTaskDesc.value = '';
};

const handleCreateTask = async () => {
  if (!newTaskTitle.value.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await emit('add-task', {
      columnId: props.column.id,
      title: newTaskTitle.value.trim(),
      description: newTaskDesc.value.trim()
    });
    cancelAddTask();
  } finally {
    isSubmitting.value = false;
  }
};

const closeMenuOnClickOutside = (e) => {
  if (showMenu.value && !e.target.closest('.col-actions')) {
    showMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeMenuOnClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside);
});
</script>

<style scoped>
.board-column {
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 140px);
  border: 2px solid transparent;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.board-column.drop-active {
  background-color: #e2e8f0;
  border-color: #818cf8;
}

.column-header {
  padding: 12px 14px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.column-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.column-title-input {
  font-size: 14px;
  font-weight: 700;
  padding: 2px 6px;
  border: 1px solid #6366f1;
  border-radius: 4px;
  width: 140px;
  outline: none;
}

.task-badge {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 7px;
  border-radius: 10px;
}

.col-actions {
  position: relative;
}

.action-dots {
  background: none;
  border: none;
  color: #64748b;
  font-size: 16px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}

.action-dots:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.menu-popover {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 140px;
  z-index: 40;
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.menu-item {
  background: none;
  border: none;
  text-align: left;
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #334155;
}

.menu-item:hover {
  background: #f1f5f9;
}

.menu-item.danger {
  color: #dc2626;
}

.menu-item.danger:hover {
  background: #fef2f2;
}

.column-tasks {
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 40px;
}

.empty-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

.column-footer {
  padding: 8px 10px 10px;
}

.add-card-btn {
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s ease;
}

.add-card-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.add-task-form {
  background: #ffffff;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.new-task-input {
  width: 100%;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
}

.new-task-input:focus {
  border-color: #6366f1;
}

.new-task-textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  outline: none;
  resize: none;
  box-sizing: border-box;
  font-family: inherit;
}

.new-task-textarea:focus {
  border-color: #6366f1;
}

.form-actions {
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

.btn-submit {
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

