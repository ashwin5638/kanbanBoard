import { ref, computed } from 'vue';
import { storage } from '../services/api';

// Simple reactive state for MVP routing
export const currentRoute = ref({
  page: storage.getToken() ? 'dashboard' : 'login',
  boardId: null,
});

export function useRouter() {
  const currentPath = computed(() => {
    if (currentRoute.value.page === 'login') return '/login';
    if (currentRoute.value.page === 'dashboard') return '/dashboard';
    if (currentRoute.value.page === 'board') return `/board/${currentRoute.value.boardId}`;
    return '/dashboard';
  });

  return {
    currentPath,
    push(path) {
      if (path === '/login') {
        currentRoute.value = { page: 'login', boardId: null };
      } else if (path === '/dashboard') {
        currentRoute.value = { page: 'dashboard', boardId: null };
      } else if (path.startsWith('/board/')) {
        const boardId = path.split('/board/')[1];
        currentRoute.value = { page: 'board', boardId };
      }
    },
  };
}

export function useRoute() {
  return computed(() => ({
    params: {
      boardId: currentRoute.value.boardId,
    },
  }));
}
