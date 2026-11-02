// Real-time Presence & Activity Service
class SocketService {
  constructor() {
    this.listeners = new Map();
    this.ws = null;
    this.connected = false;
    this.currentUser = null;
    this.currentBoardId = null;
    this.heartbeatInterval = null;
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

  // Unsubscribe from an event
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Emit event to subscribers
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  // Connect to workspace / board presence
  connect(user, boardId = null) {
    this.currentUser = user;
    this.currentBoardId = boardId;
    this.connected = true;

    // Initialize mock online presence teammates
    this._initPresence();

    this.emit('connection_status', { connected: true });
    this.emit('presence_update', this.onlineUsers);
  }

  disconnect() {
    this.connected = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emit('connection_status', { connected: false });
  }

  setViewingBoard(boardId) {
    this.currentBoardId = boardId;
    if (this.currentUser) {
      this.logActivity({
        userId: this.currentUser.id || this.currentUser.userId,
        userName: this.currentUser.name || 'Current User',
        action: 'viewed_board',
        details: `joined board ${boardId}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  logActivity({ action, details, meta = {} }) {
    const activity = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userName: this.currentUser?.name || 'You',
      userEmail: this.currentUser?.email || '',
      action,
      details,
      meta,
      timestamp: new Date().toISOString()
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

  _initPresence() {
    const baseUsers = [];
    if (this.currentUser) {
      baseUsers.push({
        id: this.currentUser.id || this.currentUser.userId || 'self',
        name: this.currentUser.name || 'You',
        email: this.currentUser.email || '',
        role: this.currentUser.role || 'MEMBER',
        status: 'online',
        isSelf: true,
        lastActive: 'Just now'
      });
    }

    // Teammate presence
    baseUsers.push(
      {
        id: 'u_collab_1',
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        role: 'ADMIN',
        status: 'online',
        isSelf: false,
        lastActive: 'Viewing board'
      },
      {
        id: 'u_collab_2',
        name: 'Alex Rivera',
        email: 'alex@example.com',
        role: 'MEMBER',
        status: 'idle',
        isSelf: false,
        lastActive: '5m ago'
      }
    );

    this.onlineUsers = baseUsers;
  }
}

export const socket = new SocketService();
export default socket;

