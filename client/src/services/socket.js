import { io } from 'socket.io-client';
import { storage } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
    this.currentUser = null;
    this.currentTenantId = null;
    this.currentBoardId = null;
    this.activities = [];
    this.onlineUsers = [];
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in local event handler for ${event}:`, err);
        }
      });
    }

    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  // Connect to real-time WebSocket backend
  connect(user, tenantId = null) {
    this.currentUser = user || storage.getUser();
    this.currentTenantId = tenantId || storage.getTenantId();

    const token = storage.getToken();

    if (!this.socket) {
      try {
        this.socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          this.connected = true;
          this.emit('connection_status', { connected: true });

          // Join current tenant room upon connection
          if (this.currentTenantId) {
            this.joinTenant(this.currentTenantId);
          }
          if (this.currentBoardId) {
            this.joinBoard(this.currentBoardId);
          }
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          this.emit('connection_status', { connected: false });
        });

        // Listen for presence updates from tenant room
        this.socket.on('presence_update', (users) => {
          this.onlineUsers = users;
          this.emit('presence_update', users);
        });

        // Listen for live activity events from tenant room
        this.socket.on('activity_event', (act) => {
          this.logActivity(act);
        });

        // Live task synchronization events from board room
        this.socket.on('task_created', (task) => {
          this.emit('task_created', task);
        });

        this.socket.on('task_updated', (task) => {
          this.emit('task_updated', task);
        });

        this.socket.on('task_deleted', (payload) => {
          this.emit('task_deleted', payload);
        });
      } catch (err) {
        console.warn('Socket connection error, running in local fallback mode:', err);
      }
    } else if (this.socket.disconnected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connected = false;
    this.emit('connection_status', { connected: false });
  }

  joinTenant(tenantId) {
    this.currentTenantId = tenantId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_tenant', {
        tenantId,
        user: this.currentUser,
      });
    }
  }

  joinBoard(boardId) {
    this.currentBoardId = boardId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_board', { boardId });
    }
    this.logActivity({
      action: 'viewed_board',
      details: `joined board ${boardId}`,
    });
  }

  leaveBoard(boardId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_board', { boardId });
    }
    if (this.currentBoardId === boardId) {
      this.currentBoardId = null;
    }
  }

  setViewingBoard(boardId) {
    this.joinBoard(boardId);
  }

  broadcastTaskMoved(taskData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('task_moved_client', {
        ...taskData,
        tenantId: this.currentTenantId,
        boardId: this.currentBoardId,
      });
    }
  }

  logActivity({ action, details, meta = {}, userName = null }) {
    const activity = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userName: userName || this.currentUser?.name || 'You',
      action,
      details,
      meta,
      timestamp: new Date().toISOString(),
    };

    this.activities.unshift(activity);
    if (this.activities.length > 50) {
      this.activities.pop();
    }

    this.emit('activity_logged', activity);
    this.emit('activities_updated', [...this.activities]);
  }

  getActivities() {
    return [...this.activities];
  }

  getOnlineUsers() {
    return [...this.onlineUsers];
  }
}

export const socket = new SocketService();
export default socket;
