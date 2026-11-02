<template>
  <div class="app-root">
    <Login v-if="currentRoute.page === 'login'" />
    <Dashboard v-else-if="currentRoute.page === 'dashboard'" />
    <Board v-else-if="currentRoute.page === 'board'" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { currentRoute } from './routes';
import { useTenant } from './context/TenantContext';

import Login from './pages/Login.vue';
import Dashboard from './pages/Dashboard.vue';
import Board from './pages/Board.vue';

const { loadTenants, loadOrganization } = useTenant();

onMounted(async () => {
  await loadTenants();
  await loadOrganization();
});
</script>

<style>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

