<template>
  <div class="app-root">
    <RouterView />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { provideAuth } from './context/AuthContext';
import { provideTenant } from './context/TenantContext';
import { provideRouter, RouterView } from './routes';

provideAuth();
const tenantState = provideTenant();
provideRouter();

onMounted(async () => {
  // Preload tenants if user is authenticated
  await tenantState.loadTenants();
  await tenantState.loadOrganization();
});
</script>

<style>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
