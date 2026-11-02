const prisma = require('../config/db');


const createTask = async (req, res) => {
  try {
    const { columnId, title, description, assignedToId } = req.body;

    if (!columnId || !title) {
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
        title,
        description,
        position: newPosition,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
};

// Update task details or move it across columns/positions (Drag & Drop)
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, columnId, position, assignedToId } = req.body;

    // Fetch existing task for optimistic locking / validation check
    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        columnId: columnId !== undefined ? columnId : existingTask.columnId,
        position: position !== undefined ? position : existingTask.position,
        assignedToId: assignedToId !== undefined ? assignedToId : existingTask.assignedToId,
        version: { increment: 1 }, // Increments optimistic locking version
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

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

    await prisma.task.delete({
      where: { id: taskId },
    });

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