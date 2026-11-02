import { ref, onMounted, onUnmounted } from 'vue';
import socket from '../services/socket';

export function usePresence() {
  const onlineUsers = ref(socket.getOnlineUsers());
  const activities = ref(socket.getActivities());
  const isConnected = ref(socket.connected);

  let unsubs = [];

  onMounted(() => {
    unsubs.push(
      socket.on('presence_update', (users) => {
        onlineUsers.value = users;
      }),
      socket.on('activity_logged', (act) => {
        activities.value = socket.getActivities();
      }),
      socket.on('activities_updated', (allActs) => {
        activities.value = allActs;
      }),
      socket.on('connection_status', ({ connected }) => {
        isConnected.value = connected;
      })
    );
  });

  onUnmounted(() => {
    unsubs.forEach((unsub) => unsub && unsub());
  });

  const logActivity = (action, details, meta) => {
    socket.logActivity({ action, details, meta });
  };

  return {
    onlineUsers,
    activities,
    isConnected,
    logActivity,
  };
}

export default usePresence;

