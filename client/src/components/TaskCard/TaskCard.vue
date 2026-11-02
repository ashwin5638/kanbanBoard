<template>
  <div
    class="task-card"
    :class="{ 'is-dragging': isDragging }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="$emit('select', task)"
  >
    <div class="card-top">
      <h4 class="task-title">{{ task.title }}</h4>
      <div class="card-actions" @click.stop>
        <button
          v-if="availableColumns && availableColumns.length > 1"
          class="move-menu-trigger"
          @click="showMoveMenu = !showMoveMenu"
          title="Quick move to another column"
          type="button"
        >
          ↔
        </button>

        <!-- Quick move popover -->
        <div v-if="showMoveMenu" class="move-popover">
          <span class="popover-title">Move to:</span>
          <button
            v-for="col in availableColumns"
            :key="col.id"
            :disabled="col.id === task.columnId"
            class="move-item"
            @click="handleQuickMove(col.id)"
            type="button"
          >
            {{ col.title }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="task.description" class="task-desc">
      {{ truncate(task.description, 90) }}
    </p>

    <div class="card-bottom">
      <div class="assignee-wrap" :title="task.assignedTo ? `Assigned to ${task.assignedTo.name}` : 'Unassigned'">
        <div v-if="task.assignedTo" class="assignee-avatar">
          {{ getInitials(task.assignedTo.name) }}
        </div>
        <span v-else class="unassigned-pill">Unassigned</span>
      </div>

      <div class="card-badges">
        <span class="version-badge" title="Optimistic locking version">
          v{{ task.version || 1 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  task: { type: Object, required: true },
  availableColumns: { type: Array, default: () => [] }
});

const emit = defineEmits(['select', 'drag-start', 'drag-end', 'quick-move']);

const isDragging = ref(false);
const showMoveMenu = ref(false);

const onDragStart = (e) => {
  isDragging.value = true;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: props.task.id, columnId: props.task.columnId }));
  emit('drag-start', props.task);
};

const onDragEnd = () => {
  isDragging.value = false;
  emit('drag-end');
};

const handleQuickMove = (colId) => {
  showMoveMenu.value = false;
  emit('quick-move', { taskId: props.task.id, targetColumnId: colId });
};

const truncate = (text, len) => {
  if (!text) return '';
  return text.length > len ? text.substring(0, len) + '...' : text;
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
};

const closeMenuOnOutsideClick = (e) => {
  if (showMoveMenu.value && !e.target.closest('.card-actions')) {
    showMoveMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeMenuOnOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnOutsideClick);
});
</script>

<style scoped>
.task-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: grab;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  user-select: none;
  position: relative;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.task-card.is-dragging {
  opacity: 0.4;
  transform: scale(0.98);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.task-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.35;
  word-break: break-word;
}

.card-actions {
  position: relative;
}

.move-menu-trigger {
  background: none;
  border: none;
  color: #94a3b8;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}

.move-menu-trigger:hover {
  background: #f1f5f9;
  color: #475569;
}

.move-popover {
  position: absolute;
  top: 100%;
  right: 0;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  width: 130px;
  z-index: 50;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.popover-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  padding: 2px 4px;
}

.move-item {
  background: none;
  border: none;
  border-radius: 4px;
  text-align: left;
  padding: 5px 6px;
  font-size: 12px;
  color: #334155;
  cursor: pointer;
}

.move-item:hover:not(:disabled) {
  background: #eef2ff;
  color: #4338ca;
}

.move-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.task-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  word-break: break-word;
}

.card-bottom {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unassigned-pill {
  font-size: 10px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 4px;
}

.version-badge {
  font-size: 10px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1px 4px;
  border-radius: 4px;
  font-family: monospace;
}
</style>

