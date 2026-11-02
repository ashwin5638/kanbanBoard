import { ref, computed, defineComponent, h, inject, provide, markRaw } from 'vue';
import { storage } from '../services/api';

import Login from '../pages/Login.vue';
import Dashboard from '../pages/Dashboard.vue';
import Board from '../pages/Board.vue';

const ROUTER_KEY = Symbol('SimpleRouter');

const routes = [
  { path: '/login', component: markRaw(Login), public: true },
  { path: '/dashboard', component: markRaw(Dashboard), requiresAuth: true },
  { path: '/board/:boardId', component: markRaw(Board), requiresAuth: true },
  { path: '/', redirect: '/dashboard' }
];

export function createRouter() {
  const currentPath = ref(window.location.pathname || '/dashboard');

  const matchRoute = (path) => {
    // Check exact matches first
    for (const route of routes) {
      if (route.path === path) {
        return { route, params: {} };
      }
    }

    // Check parameterized paths like /board/:boardId
    for (const route of routes) {
      if (route.path.includes(':')) {
        const routeSegments = route.path.split('/');
        const pathSegments = path.split('/');

        if (routeSegments.length === pathSegments.length) {
          const params = {};
          let match = true;

          for (let i = 0; i < routeSegments.length; i++) {
            if (routeSegments[i].startsWith(':')) {
              const paramName = routeSegments[i].slice(1);
              params[paramName] = pathSegments[i];
            } else if (routeSegments[i] !== pathSegments[i]) {
              match = false;
              break;
            }
          }

          if (match) {
            return { route, params };
          }
        }
      }
    }

    // Fallback default
    return { route: routes[0], params: {} };
  };

  const navigate = (to, replace = false) => {
    const token = storage.getToken();

    let targetPath = to;
    if (targetPath === '/') {
      targetPath = token ? '/dashboard' : '/login';
    }

    const { route } = matchRoute(targetPath);

    // Auth guard check
    if (route.requiresAuth && !token) {
      targetPath = '/login';
    } else if (route.public && token && targetPath === '/login') {
      targetPath = '/dashboard';
    }

    if (replace) {
      window.history.replaceState({}, '', targetPath);
    } else if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    currentPath.value = targetPath;
  };

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    currentPath.value = window.location.pathname || '/';
  });

  // Initial redirect check
  const token = storage.getToken();
  if (currentPath.value === '/' || (currentPath.value === '/login' && token)) {
    navigate(token ? '/dashboard' : '/login', true);
  } else if (!token && currentPath.value !== '/login') {
    navigate('/login', true);
  }

  const currentMatched = computed(() => matchRoute(currentPath.value));

  const router = {
    currentPath,
    push: (to) => navigate(to, false),
    replace: (to) => navigate(to, true),
    currentRoute: currentMatched,
  };

  return router;
}

let globalRouter = null;

export function provideRouter() {
  if (!globalRouter) {
    globalRouter = createRouter();
  }
  provide(ROUTER_KEY, globalRouter);
  return globalRouter;
}

export function useRouter() {
  const router = inject(ROUTER_KEY);
  if (!router) {
    if (!globalRouter) {
      globalRouter = createRouter();
    }
    return globalRouter;
  }
  return router;
}

export function useRoute() {
  const router = useRouter();
  return computed(() => ({
    path: router.currentPath.value,
    params: router.currentRoute.value.params,
    route: router.currentRoute.value.route,
  }));
}

export const RouterView = defineComponent({
  name: 'RouterView',
  setup() {
    const router = useRouter();
    return () => {
      const match = router.currentRoute.value;
      const Component = match.route?.component;
      if (!Component) return null;
      return h(Component, { key: router.currentPath.value, params: match.params });
    };
  }
});

export const RouterLink = defineComponent({
  name: 'RouterLink',
  props: {
    to: { type: String, required: true },
    class: { type: String, default: '' },
  },
  setup(props, { slots }) {
    const router = useRouter();
    const handleClick = (e) => {
      e.preventDefault();
      router.push(props.to);
    };

    return () => h(
      'a',
      {
        href: props.to,
        class: props.class,
        onClick: handleClick,
      },
      slots.default ? slots.default() : null
    );
  }
});

