<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-brand">
        <div class="brand-badge">⚡</div>
        <h1>KanbanFlow</h1>
        <p class="tagline">Enterprise Multi-Tenant Kanban System</p>
      </div>

      <!-- Mode Tabs -->
      <div class="tab-switch">
        <button
          class="tab-btn"
          :class="{ active: mode === 'login' }"
          @click="setMode('login')"
          type="button"
        >
          Sign In
        </button>
        <button
          class="tab-btn"
          :class="{ active: mode === 'register' }"
          @click="setMode('register')"
          type="button"
        >
          Create Account
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-alert">
        <span>⚠️ {{ errorMessage }}</span>
      </div>

      <!-- Success Alert -->
      <div v-if="successMessage" class="success-alert">
        <span>✓ {{ successMessage }}</span>
      </div>

      <!-- Login Form -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-field">
          <label>Email Address</label>
          <input
            v-model="loginForm.email"
            type="email"
            required
            placeholder="you@company.com"
            class="input-box"
          />
        </div>

        <div class="form-field">
          <label>Password</label>
          <input
            v-model="loginForm.password"
            type="password"
            required
            placeholder="••••••••"
            class="input-box"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          {{ isLoading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-field">
          <label>Full Name</label>
          <input
            v-model="registerForm.name"
            type="text"
            required
            placeholder="Jane Doe"
            class="input-box"
          />
        </div>

        <div class="form-field">
          <label>Email Address</label>
          <input
            v-model="registerForm.email"
            type="email"
            required
            placeholder="jane@company.com"
            class="input-box"
          />
        </div>

        <div class="form-field">
          <label>Password</label>
          <input
            v-model="registerForm.password"
            type="password"
            required
            placeholder="At least 6 characters"
            class="input-box"
          />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Organization Name</label>
            <input
              v-model="registerForm.organizationName"
              type="text"
              required
              placeholder="Acme Corp"
              class="input-box"
            />
          </div>

          <div class="form-field">
            <label>Workspace Name</label>
            <input
              v-model="registerForm.tenantName"
              type="text"
              required
              placeholder="Engineering"
              class="input-box"
            />
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          {{ isLoading ? 'Creating Account...' : 'Get Started' }}
        </button>
      </form>

      <div class="demo-helpers">
        <span class="demo-text">Need a test login?</span>
        <button class="demo-btn" @click="fillDemoCredentials" type="button">
          Fill Demo Credentials
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from '../routes';

const { login, register, isLoading } = useAuth();
const router = useRouter();

const mode = ref('login');
const errorMessage = ref('');
const successMessage = ref('');

const loginForm = reactive({
  email: '',
  password: '',
});

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  organizationName: '',
  tenantName: '',
});

const setMode = (m) => {
  mode.value = m;
  errorMessage.value = '';
  successMessage.value = '';
};

const handleLogin = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  const res = await login(loginForm.email, loginForm.password);
  if (res.success) {
    router.push('/dashboard');
  } else {
    errorMessage.value = res.error || 'Invalid credentials';
  }
};

const handleRegister = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  const res = await register(registerForm);
  if (res.success) {
    successMessage.value = 'Account created successfully! Please sign in.';
    loginForm.email = registerForm.email;
    loginForm.password = registerForm.password;
    setMode('login');
  } else {
    errorMessage.value = res.error || 'Registration failed';
  }
};

const fillDemoCredentials = () => {
  if (mode.value === 'login') {
    loginForm.email = 'admin@example.com';
    loginForm.password = 'password123';
  } else {
    registerForm.name = 'Alex Rivera';
    registerForm.email = 'alex.rivera@kanbanflow.io';
    registerForm.password = 'Pass1234!';
    registerForm.organizationName = 'Starlight Technologies';
    registerForm.tenantName = 'Product & Design';
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 20%, #e0e7ff 0%, #f8fafc 80%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  padding: 32px 36px;
}

.card-brand {
  text-align: center;
  margin-bottom: 24px;
}

.brand-badge {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 12px;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
}

.card-brand h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.tagline {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.tab-switch {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  background: none;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.error-alert {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

.success-alert {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #15803d;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-box {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}

.input-box:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.submit-btn {
  margin-top: 6px;
  padding: 12px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
  transition: background 0.15s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #4338ca;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-helpers {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.demo-text {
  font-size: 12px;
  color: #94a3b8;
}

.demo-btn {
  background: none;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  cursor: pointer;
}

.demo-btn:hover {
  background: #eef2ff;
  border-color: #a5b4fc;
}
</style>

