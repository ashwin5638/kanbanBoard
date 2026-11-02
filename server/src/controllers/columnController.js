const prisma = require('../config/db');

// Create a new column on a board
const createColumn = async (req, res) => {
  try {
    const { boardId, title } = req.body;

    if (!boardId || !title) {
      return res.status(400).json({ success: false, error: 'Board ID and title are required' });
    }

    // Get highest position to place column at the end
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
    });

    const newPosition = lastColumn ? lastColumn.position + 1 : 0;

    const column = await prisma.column.create({
      data: {
        boardId,
        title,
        position: newPosition,
      },
      include: { tasks: true },
    });

    res.status(201).json({ success: true, data: column });
  } catch (error) {
    console.error('Create column error:', error);
    res.status(500).json({ success: false, error: 'Failed to create column' });
  }
};

// Update column title 
const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { title, position } = req.body;

    const existingColumn = await prisma.column.findUnique({ where: { id: columnId } });
    if (!existingColumn) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    const updatedColumn = await prisma.column.update({
      where: { id: columnId },
      data: {
        title: title !== undefined ? title : existingColumn.title,
        position: position !== undefined ? position : existingColumn.position,
      },
    });

    res.status(200).json({ success: true, data: updatedColumn });
  } catch (error) {
    console.error('Update column error:', error);
    res.status(500).json({ success: false, error: 'Failed to update column' });
  }
};

// Delete a column 
const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    await prisma.column.delete({
      where: { id: columnId },
    });

    res.status(200).json({ success: true, message: 'Column deleted successfully' });
  } catch (error) {
    console.error('Delete column error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete column' });
  }
};

module.exports = {
  createColumn,
  updateColumn,
  deleteColumn,
};

