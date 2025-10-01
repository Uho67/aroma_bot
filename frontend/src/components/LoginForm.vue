<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <i class="fab fa-telegram-plane text-primary me-2 fs-1"></i>
        <h2 class="login-title">Bot Dashboard</h2>
        <p class="login-subtitle">Admin Authentication</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="form-label">
            <i class="fas fa-user me-2"></i>Username
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-control"
            placeholder="Enter your username"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">
            <i class="fas fa-lock me-2"></i>Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            placeholder="Enter your password"
            required
            :disabled="loading"
          />
        </div>

        <button 
          type="submit" 
          class="btn btn-primary login-btn"
          :disabled="loading || !username || !password"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="fas fa-sign-in-alt me-2"></i>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div v-if="error" class="alert alert-danger mt-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <div class="login-footer">
        <small class="text-muted">
          <i class="fas fa-shield-alt me-1"></i>
          Secure admin access
        </small>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '../services/authService.js'

export default {
  name: 'LoginForm',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.error = '';

      try {
        const result = await authService.login(this.username, this.password);
        
        if (result.success) {
          // Emit login success event to parent
          this.$emit('login-success', result.admin);
        }
      } catch (error) {
        this.error = error.message || 'Login failed. Please check your credentials.';
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    // Focus on username field
    this.$nextTick(() => {
      document.getElementById('username').focus();
    });
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 400px;
  animation: slideInUp 0.6s ease-out;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0.5rem 0;
}

.login-subtitle {
  color: #718096;
  margin: 0;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-control {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.form-control:disabled {
  background-color: #f7fafc;
  opacity: 0.7;
}

.login-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.alert {
  border-radius: 12px;
  border: none;
  padding: 1rem;
  font-size: 0.9rem;
}

.alert-danger {
  background: rgba(245, 101, 101, 0.1);
  color: #c53030;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
}
</style>
