const prisma = require('../config/db');

const createBoard = async (req, res) => {
  try {
    const { tenantId } = req;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Board title is required' });
    }

    const board = await prisma.board.create({
      data: {
        title,
        tenantId,
        columns: {
          create: [
            { title: 'To Do', position: 0 },
            { title: 'In Progress', position: 1 },
            { title: 'Done', position: 2 },
          ],
        },
      },
      include: { columns: true },
    });

    res.status(201).json({ success: true, data: board });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ success: false, error: 'Failed to create board' });
  }
};

const getBoards = async (req, res) => {
  try {
    const { tenantId } = req;

    const boards = await prisma.board.findMany({
      where: { tenantId },
      include: {
        columns: {
          include: {
            _count: { select: { tasks: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: boards });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch boards' });
  }
};





const getBoardById = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignedTo: { select: { id: true, name: true, email: true } }
              }
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    res.status(200).json({ success: true, data: board });
  } catch (error) {
    console.error('Get board by id error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch board details' });
  }
};

module.exports = {
    createBoard,
    getBoards,
    getBoardById,
};