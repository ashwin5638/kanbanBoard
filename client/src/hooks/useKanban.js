import { ref, computed } from 'vue';
import { api } from '../services/api';
import socket from '../services/socket';

export function useKanban(boardIdRef) {
  const board = ref(null);
  const columns = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Search & Filter
  const searchQuery = ref('');
  const selectedAssignee = ref('ALL');

  // Drag and drop state
  const draggingTask = ref(null);
  const dropTargetColumnId = ref(null);

  // Task details modal
  const selectedTask = ref(null);
  const isDetailsOpen = ref(false);

  const loadBoard = async (id = null) => {
    const targetId = id || (boardIdRef && typeof boardIdRef === 'object' ? boardIdRef.value : boardIdRef);
    if (!targetId) return null;

    isLoading.value = true;
    error.value = null;
    try {
      const res = await api.boards.getById(targetId);
      board.value = res.data;
      columns.value = res.data?.columns || [];
      socket.setViewingBoard(targetId);
      return res.data;
    } catch (err) {
      error.value = err.message || 'Failed to load board details';
      console.error('Error loading board:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Add column
  const addColumn = async (title) => {
    if (!board.value?.id || !title.trim()) return;
    try {
      const res = await api.columns.create({ boardId: board.value.id, title: title.trim() });
      const newCol = { ...res.data, tasks: [] };
      columns.value.push(newCol);
      socket.logActivity({
        action: 'created_column',
        details: `added column "${title.trim()}"`
      });
      return newCol;
    } catch (err) {
      console.error('Error creating column:', err);
      throw err;
    }
  };

  // Update column
  const updateColumn = async (columnId, { title, position }) => {
    try {
      const res = await api.columns.update(columnId, { title, position });
      const col = columns.value.find((c) => c.id === columnId);
      if (col) {
        if (title !== undefined) col.title = title;
        if (position !== undefined) col.position = position;
      }
      return res.data;
    } catch (err) {
      console.error('Error updating column:', err);
      throw err;
    }
  };

  // Delete column
  const deleteColumn = async (columnId) => {
    try {
      await api.columns.delete(columnId);
      const col = columns.value.find((c) => c.id === columnId);
      columns.value = columns.value.filter((c) => c.id !== columnId);
      socket.logActivity({
        action: 'deleted_column',
        details: `removed column "${col?.title || ''}"`
      });
    } catch (err) {
      console.error('Error deleting column:', err);
      throw err;
    }
  };

  // Add Task
  const addTask = async (columnId, title, description = '', assignedToId = null) => {
    if (!title.trim()) return;
    try {
      const res = await api.tasks.create({
        columnId,
        title: title.trim(),
        description: description.trim(),
        assignedToId: assignedToId || null,
      });
      const newTask = res.data;

      const col = columns.value.find((c) => c.id === columnId);
      if (col) {
        col.tasks = [...(col.tasks || []), newTask];
      }

      socket.logActivity({
        action: 'created_task',
        details: `created task "${newTask.title}" in "${col?.title || 'column'}"`
      });

      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  // Update Task
  const updateTask = async (taskId, updates) => {
    try {
      const res = await api.tasks.update(taskId, updates);
      const updated = res.data;

      // Update in local state
      for (const col of columns.value) {
        const index = (col.tasks || []).findIndex((t) => t.id === taskId);
        if (index !== -1) {
          if (updates.columnId && updates.columnId !== col.id) {
            // Task moved to another column
            const [movedTask] = col.tasks.splice(index, 1);
            const targetCol = columns.value.find((c) => c.id === updates.columnId);
            if (targetCol) {
              targetCol.tasks = [...(targetCol.tasks || []), { ...movedTask, ...updated }];
            }
          } else {
            col.tasks[index] = { ...col.tasks[index], ...updated };
          }
          break;
        }
      }

      if (selectedTask.value && selectedTask.value.id === taskId) {
        selectedTask.value = { ...selectedTask.value, ...updated };
      }

      socket.logActivity({
        action: 'updated_task',
        details: `updated task "${updated.title}"`
      });

      return updated;
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  // Move Task across columns (drag & drop or quick move)
  const moveTask = async (taskId, targetColumnId, newPosition = null) => {
    let currentTask = null;
    let sourceCol = null;

    // Locate source task
    for (const col of columns.value) {
      const found = (col.tasks || []).find((t) => t.id === taskId);
      if (found) {
        currentTask = found;
        sourceCol = col;
        break;
      }
    }

    if (!currentTask) return;
    const targetCol = columns.value.find((c) => c.id === targetColumnId);
    if (!targetCol) return;

    const calculatedPosition = newPosition !== null ? newPosition : (targetCol.tasks?.length || 0);

    // Optimistic update in UI
    sourceCol.tasks = sourceCol.tasks.filter((t) => t.id !== taskId);
    const updatedTask = {
      ...currentTask,
      columnId: targetColumnId,
      position: calculatedPosition,
      version: (currentTask.version || 1) + 1
    };
    targetCol.tasks = [...(targetCol.tasks || []), updatedTask];

    try {
      await api.tasks.update(taskId, {
        columnId: targetColumnId,
        position: calculatedPosition,
      });

      socket.logActivity({
        action: 'moved_task',
        details: `moved "${currentTask.title}" from "${sourceCol.title}" to "${targetCol.title}"`
      });
    } catch (err) {
      console.error('Failed to persist task move, rolling back:', err);
      // Rollback
      targetCol.tasks = targetCol.tasks.filter((t) => t.id !== taskId);
      sourceCol.tasks.push(currentTask);
    }
  };

  // Delete Task
  const deleteTask = async (taskId) => {
    try {
      await api.tasks.delete(taskId);
      let removedTitle = '';
      for (const col of columns.value) {
        const index = (col.tasks || []).findIndex((t) => t.id === taskId);
        if (index !== -1) {
          removedTitle = col.tasks[index].title;
          col.tasks.splice(index, 1);
          break;
        }
      }

      if (selectedTask.value?.id === taskId) {
        closeTaskDetails();
      }

      socket.logActivity({
        action: 'deleted_task',
        details: `deleted task "${removedTitle}"`
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  // Task details modal handlers
  const openTaskDetails = (task) => {
    selectedTask.value = task;
    isDetailsOpen.value = true;
  };

  const closeTaskDetails = () => {
    selectedTask.value = null;
    isDetailsOpen.value = false;
  };

  // Filtered columns based on query and assignee
  const filteredColumns = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    const assigneeFilter = selectedAssignee.value;

    return columns.value.map((col) => {
      const filteredTasks = (col.tasks || []).filter((task) => {
        const matchesQuery = !q || 
          task.title.toLowerCase().includes(q) || 
          (task.description && task.description.toLowerCase().includes(q));

        const matchesAssignee = assigneeFilter === 'ALL' || 
          (assigneeFilter === 'UNASSIGNED' && !task.assignedToId) ||
          task.assignedToId === assigneeFilter;

        return matchesQuery && matchesAssignee;
      });

      return {
        ...col,
        tasks: filteredTasks
      };
    });
  });

  return {
    board,
    columns,
    filteredColumns,
    isLoading,
    error,
    searchQuery,
    selectedAssignee,
    draggingTask,
    dropTargetColumnId,
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
  };
}

export default useKanban;

