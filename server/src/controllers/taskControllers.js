const prisma = require('../config/db');

// Create Task
const createTask = async (req, res) => {
  try {
    const { columnId, title, description, assignedToId } = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!columnId || !title?.trim()) {
      return res.status(400).json({ success: false, error: 'Column ID and title are required' });
    }

    // Get the highest position in this column to place the new task at the bottom
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
    });

    const newPosition = lastTask ? lastTask.position + 1 : 0;

    const task = await prisma.task.create({
      data: {
        columnId,
        title: title.trim(),
        description: description?.trim() || null,
        position: newPosition,
        assignedToId: assignedToId || null,
        version: 1,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    const tenantId = task.column?.board?.tenantId || req.headers['x-tenant-id'];
    if (tenantId) {
      await prisma.activityLog.create({
        data: {
          tenantId,
          userId,
          action: 'TASK_CREATED',
          entityType: 'TASK',
          entityId: task.id,
          details: `Created task "${task.title}"`,
        },
      }).catch((err) => console.error('Activity log error:', err));
    }

    // Real-time broadcast if socket.io is active
    const io = req.app.get('io');
    if (io && task.column?.boardId) {
      io.to(`board:${task.column.boardId}`).emit('task_created', task);
      if (tenantId) {
        io.to(`tenant:${tenantId}`).emit('activity_event', {
          action: 'created_task',
          details: `created task "${task.title}"`,
          userName: req.user?.name || 'Teammate',
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
};

// Update task details or move it across columns/positions with Optimistic Locking (HTTP 409)
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, columnId, position, assignedToId, version } = req.body;
    const userId = req.user?.id || req.user?.userId;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // 🔒 CONCURRENCY & CONFLICT RESOLUTION:
    // If client provided a version and it differs from existing version, reject with 409 Conflict
    if (version !== undefined && Number(version) !== existingTask.version) {
      return res.status(409).json({
        success: false,
        conflict: true,
        error: `Conflict: Task "${existingTask.title}" has been modified by another user (v${existingTask.version} vs expected v${version}). Please refresh to get latest state.`,
        currentVersion: existingTask.version,
        expectedVersion: version,
        currentTask: existingTask,
      });
    }

    const isMovingColumn = columnId && columnId !== existingTask.columnId;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title.trim() : existingTask.title,
        description: description !== undefined ? (description?.trim() || null) : existingTask.description,
        columnId: columnId !== undefined ? columnId : existingTask.columnId,
        position: position !== undefined ? position : existingTask.position,
        assignedToId: assignedToId !== undefined ? assignedToId : existingTask.assignedToId,
        version: { increment: 1 }, // Atomically increment locking version
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    const tenantId = updatedTask.column?.board?.tenantId || req.headers['x-tenant-id'];
    if (tenantId) {
      await prisma.activityLog.create({
        data: {
          tenantId,
          userId,
          action: isMovingColumn ? 'TASK_MOVED' : 'TASK_UPDATED',
          entityType: 'TASK',
          entityId: updatedTask.id,
          details: isMovingColumn
            ? `Moved task "${updatedTask.title}" to "${updatedTask.column.title}"`
            : `Updated task "${updatedTask.title}" (v${updatedTask.version})`,
        },
      }).catch((err) => console.error('Activity log error:', err));
    }

    // Real-time broadcast if socket.io is active
    const io = req.app.get('io');
    if (io && updatedTask.column?.boardId) {
      io.to(`board:${updatedTask.column.boardId}`).emit('task_updated', updatedTask);
      if (tenantId) {
        io.to(`tenant:${tenantId}`).emit('activity_event', {
          action: isMovingColumn ? 'moved_task' : 'updated_task',
          details: isMovingColumn
            ? `moved task "${updatedTask.title}"`
            : `updated task "${updatedTask.title}"`,
          userName: req.user?.name || 'Teammate',
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    const tenantId = existingTask.column?.board?.tenantId || req.headers['x-tenant-id'];
    if (tenantId) {
      await prisma.activityLog.create({
        data: {
          tenantId,
          userId,
          action: 'TASK_DELETED',
          entityType: 'TASK',
          entityId: taskId,
          details: `Deleted task "${existingTask.title}"`,
        },
      }).catch((err) => console.error('Activity log error:', err));
    }

    // Real-time broadcast
    const io = req.app.get('io');
    if (io && existingTask.column?.boardId) {
      io.to(`board:${existingTask.column.boardId}`).emit('task_deleted', {
        taskId,
        columnId: existingTask.columnId,
      });
      if (tenantId) {
        io.to(`tenant:${tenantId}`).emit('activity_event', {
          action: 'deleted_task',
          details: `deleted task "${existingTask.title}"`,
          userName: req.user?.name || 'Teammate',
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
};
