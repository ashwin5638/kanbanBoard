require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const prisma = require('./src/config/db');

const authRoute = require('./src/routes/authRoutes');
const organizationRoute = require('./src/routes/organizationRoute');
const tenantRoute = require('./src/routes/tenantRoutes');
const boardRoute = require('./src/routes/boardRoute');
const columnRoute = require('./src/routes/columnRoute');
const taskRoute = require('./src/routes/taskRoute');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({ take: 5 });
    res.json({
      success: true,
      message: 'Database connected successfully',
      organizations: orgs,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mount Routes (supporting both /api/auth and /auth for spec compliance)
app.use('/api/auth', authRoute);
app.use('/auth', authRoute);
app.use('/api/organizations', organizationRoute);
app.use('/api/tenants', tenantRoute);
app.use('/api/boards', boardRoute);
app.use('/api/columns', columnRoute);
app.use('/api/tasks', taskRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// ⚡ Socket.IO Real-Time Engine (Tenant & Board Scoped Rooms)
const onlineTenantUsers = new Map(); // tenantId -> Map(userId -> { user, socketIds: Set })

// Optional JWT authentication for WebSockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.warn('Socket token verification failed, continuing as guest:', err.message);
    next();
  }
});

io.on('connection', (socket) => {
  let currentTenantId = null;
  let currentBoardId = null;

  // Join tenant-scoped room
  socket.on('join_tenant', ({ tenantId, user }) => {
    if (!tenantId) return;

    if (currentTenantId && currentTenantId !== tenantId) {
      socket.leave(`tenant:${currentTenantId}`);
    }

    currentTenantId = tenantId;
    socket.join(`tenant:${tenantId}`);

    const currentUser = user || socket.user;
    if (currentUser && currentUser.id) {
      if (!onlineTenantUsers.has(tenantId)) {
        onlineTenantUsers.set(tenantId, new Map());
      }
      const tenantMap = onlineTenantUsers.get(tenantId);
      if (!tenantMap.has(currentUser.id)) {
        tenantMap.set(currentUser.id, {
          id: currentUser.id,
          name: currentUser.name || 'Teammate',
          email: currentUser.email || '',
          role: currentUser.role || 'MEMBER',
          status: 'online',
          socketIds: new Set(),
        });
      }
      tenantMap.get(currentUser.id).socketIds.add(socket.id);

      // Broadcast updated online presence to this tenant's room
      const activeList = Array.from(tenantMap.values()).map(({ socketIds, ...u }) => u);
      io.to(`tenant:${tenantId}`).emit('presence_update', activeList);
    }
  });

  // Join board-scoped room for live board synchronization
  socket.on('join_board', ({ boardId }) => {
    if (!boardId) return;
    if (currentBoardId && currentBoardId !== boardId) {
      socket.leave(`board:${currentBoardId}`);
    }
    currentBoardId = boardId;
    socket.join(`board:${boardId}`);
  });

  socket.on('leave_board', ({ boardId }) => {
    if (boardId) {
      socket.leave(`board:${boardId}`);
    }
  });

  // Relay live task events between clients viewing the same board
  socket.on('task_moved_client', (data) => {
    if (data.boardId) {
      socket.to(`board:${data.boardId}`).emit('task_moved', data);
    }
    if (data.tenantId) {
      socket.to(`tenant:${data.tenantId}`).emit('activity_event', {
        action: 'moved_task',
        details: `moved task "${data.title || 'item'}"`,
        userName: socket.user?.name || 'Teammate',
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('disconnect', () => {
    if (currentTenantId && onlineTenantUsers.has(currentTenantId)) {
      const tenantMap = onlineTenantUsers.get(currentTenantId);
      for (const [userId, record] of tenantMap.entries()) {
        if (record.socketIds.has(socket.id)) {
          record.socketIds.delete(socket.id);
          if (record.socketIds.size === 0) {
            tenantMap.delete(userId);
          }
        }
      }
      const activeList = Array.from(tenantMap.values()).map(({ socketIds, ...u }) => u);
      io.to(`tenant:${currentTenantId}`).emit('presence_update', activeList);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server & WebSocket engine running on port ${PORT}`);
});
