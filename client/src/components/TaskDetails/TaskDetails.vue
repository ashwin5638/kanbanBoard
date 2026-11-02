<template>
  <div v-if="isOpen && task" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div class="header-left">
          <span class="version-tag">Task #{{ task.id.slice(0, 6) }} • v{{ task.version || 1 }}</span>
          <input
            v-if="isEditingTitle"
            v-model="editTitle"
            class="title-input"
            @blur="isEditingTitle = false"
            @keyup.enter="isEditingTitle = false"
            ref="titleInputRef"
          />
          <h2 v-else class="title-display" @click="startEditTitle">
            {{ editTitle }}
            <span class="edit-hint">✎</span>
          </h2>
        </div>
        <button class="close-btn" @click="$emit('close')" type="button">✕</button>
      </div>

      <div class="modal-body">
        <div class="main-content">
          <div class="form-group">
            <label>Description</label>
            <textarea
              v-model="editDescription"
              placeholder="Add more details to this task..."
              class="desc-textarea"
              rows="5"
            ></textarea>
          </div>

          <div class="task-dates">
            <span v-if="task.createdAt">Created: {{ formatDate(task.createdAt) }}</span>
            <span v-if="task.updatedAt">Updated: {{ formatDate(task.updatedAt) }}</span>
          </div>
        </div>

        <div class="side-controls">
          <div class="control-box">
            <label>Status / Column</label>
            <select v-model="editColumnId" class="select-control">
              <option v-for="col in columns" :key="col.id" :value="col.id">
                {{ col.title }}
              </option>
            </select>
          </div>

          <div class="control-box">
            <label>Assignee</label>
            <select v-model="editAssignedToId" class="select-control">
              <option :value="null">Unassigned</option>
              <option
                v-for="user in organization?.users || []"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }} ({{ user.role }})
              </option>
            </select>
          </div>

          <div class="danger-zone">
            <button class="btn-delete" @click="handleDelete" :disabled="isDeleting" type="button">
              🗑 {{ isDeleting ? 'Deleting...' : 'Delete Task' }}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')" type="button">Cancel</button>
        <button class="btn-save" @click="handleSave" :disabled="isSaving" type="button">
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useTenant } from '../../context/TenantContext';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  task: { type: Object, default: null },
  columns: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'update', 'delete']);

const { organization } = useTenant();

const editTitle = ref('');
const editDescription = ref('');
const editColumnId = ref('');
const editAssignedToId = ref(null);

const isEditingTitle = ref(false);
const titleInputRef = ref(null);
const isSaving = ref(false);
const isDeleting = ref(false);

watch(() => props.task, (newTask) => {
  if (newTask) {
    editTitle.value = newTask.title || '';
    editDescription.value = newTask.description || '';
    editColumnId.value = newTask.columnId || '';
    editAssignedToId.value = newTask.assignedToId || null;
  }
}, { immediate: true });

const startEditTitle = () => {
  isEditingTitle.value = true;
  nextTick(() => titleInputRef.value?.focus());
};

const handleSave = async () => {
  if (!editTitle.value.trim() || isSaving.value) return;
  isSaving.value = true;
  try {
    await emit('update', {
      taskId: props.task.id,
      updates: {
        title: editTitle.value.trim(),
        description: editDescription.value.trim(),
        columnId: editColumnId.value,
        assignedToId: editAssignedToId.value,
      }
    });
    emit('close');
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm(`Are you sure you want to delete task "${props.task.title}"?`)) return;
  isDeleting.value = true;
  try {
    await emit('delete', props.task.id);
    emit('close');
  } finally {
    isDeleting.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.version-tag {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
  text-transform: uppercase;
}

.title-display {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-display:hover .edit-hint {
  opacity: 1;
}

.edit-hint {
  font-size: 14px;
  color: #6366f1;
  opacity: 0.4;
  transition: opacity 0.15s ease;
}

.title-input {
  width: 100%;
  font-size: 18px;
  font-weight: 700;
  padding: 4px 8px;
  border: 1px solid #6366f1;
  border-radius: 6px;
  margin-top: 4px;
  outline: none;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  gap: 24px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.desc-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  color: #1e293b;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.desc-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.task-dates {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.side-controls {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-box label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.select-control {
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  outline: none;
  cursor: pointer;
}

.select-control:focus {
  border-color: #6366f1;
}

.danger-zone {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.btn-delete {
  width: 100%;
  padding: 8px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-delete:hover {
  background: #ffe4e6;
}

.modal-footer {
  padding: 14px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-secondary {
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.btn-save {
  padding: 8px 18px;
  background: #4f46e5;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:hover {
  background: #4338ca;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

