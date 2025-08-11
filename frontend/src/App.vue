<template>
  <div class="app">
    <!-- Modern Navigation -->
    <nav class="navbar navbar-expand-lg shadow-sm sticky-top">
      <div class="container-fluid px-4">
        <a class="navbar-brand d-flex align-items-center" href="#">
          <i class="fab fa-telegram-plane text-primary me-2 fs-4"></i>
          <span class="fw-bold text-dark">Bot Dashboard</span>
        </a>
        
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item mx-1">
              <a class="nav-link px-3 py-2 rounded-pill fw-medium" 
                 :class="{ 'active bg-primary text-white': currentView === 'posts' }"
                 href="#" @click.prevent="setView('posts')">
                <i class="fas fa-images me-2"></i>Посты
              </a>
            </li>
            <li class="nav-item mx-1">
              <a class="nav-link px-3 py-2 rounded-pill fw-medium" 
                 :class="{ 'active bg-primary text-white': currentView === 'buttons' }"
                 href="#" @click.prevent="setView('buttons')">
                <i class="fas fa-keyboard me-2"></i>Кнопки
              </a>
            </li>
            <li class="nav-item mx-1">
              <a class="nav-link px-3 py-2 rounded-pill fw-medium" 
                 :class="{ 'active bg-primary text-white': currentView === 'start-message' }"
                 href="#" @click.prevent="setView('start-message')">
                <i class="fas fa-comments me-2"></i>Приветствие
              </a>
            </li>
            <li class="nav-item mx-1">
              <a class="nav-link px-3 py-2 rounded-pill fw-medium" 
                 :class="{ 'active bg-primary text-white': currentView === 'user_list' }"
                 href="#" @click.prevent="setView('user_list')">
                <i class="fas fa-users me-2"></i>Пользователи
              </a>
            </li>
            <li class="nav-item mx-1">
              <a class="nav-link px-3 py-2 rounded-pill fw-medium" 
                 :class="{ 'active bg-primary text-white': currentView === 'admins' }"
                 href="#" @click.prevent="setView('admins')">
                <i class="fas fa-user-shield me-2"></i>Админы
              </a>
            </li>
            <li class="nav-item mx-1">
              <a class="nav-link px-3 py-2 rounded-pill fw-medium" 
                 :class="{ 'active bg-primary text-white': currentView === 'sales-rules' }"
                 href="#" @click.prevent="setView('sales-rules')">
                <i class="fas fa-tags me-2"></i>Правила продаж
              </a>
            </li>
            <li class="nav-item mx-1">
              <a class="nav-link px-3 py-2 rounded-pill fw-medium" 
                 :class="{ 'active bg-primary text-white': currentView === 'coupons' }"
                 href="#" @click.prevent="setView('coupons')">
                <i class="fas fa-ticket-alt me-2"></i>Купоны
              </a>
            </li>
            <li class="nav-item mx-1">
              <a class="nav-link px-3 py-2 rounded-pill fw-medium" 
                 :class="{ 'active bg-primary text-white': currentView === 'configuration' }"
                 href="#" @click.prevent="setView('configuration')">
                <i class="fas fa-cogs me-2"></i>Конфигурация
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="main-content">
      <div class="container-fluid px-4 py-4">
        <div class="row">
          <div class="col-12">
            <div class="content-wrapper fade-in">
              <PostManager v-if="currentView === 'posts'" />
              <ButtonManager v-if="currentView === 'buttons'" />
              <StartMessageManager v-if="currentView === 'start-message'" />
              <UserManager v-if="currentView === 'user_list'" />
              <AdminManager v-if="currentView === 'admins'" />
              <SalesRuleManager v-if="currentView === 'sales-rules'" />
              <CouponCodeManager v-if="currentView === 'coupons'" />
              <ConfigurationManager v-if="currentView === 'configuration'" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PostManager from './components/PostManager.vue';
import ButtonManager from './components/ButtonManager.vue';
import StartMessageManager from './components/StartMessageManager.vue';
import UserManager from './components/UserManager.vue';
import AdminManager from './components/AdminManager.vue';
import SalesRuleManager from './components/SalesRuleManager.vue';
import CouponCodeManager from './components/CouponCodeManager.vue';
import ConfigurationManager from './components/ConfigurationManager.vue';

export default {
  name: 'App',
  components: {
    PostManager,
    ButtonManager,
    StartMessageManager,
    UserManager,
    AdminManager,
    SalesRuleManager,
    CouponCodeManager,
    ConfigurationManager
  },
  data() {
    return {
      currentView: 'posts'
    };
  },
  methods: {
    setView(view) {
      this.currentView = view;
    }
  }
};
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: transparent;
}

.main-content {
  min-height: calc(100vh - 80px);
}

.content-wrapper {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.navbar-brand {
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.navbar-brand:hover {
  transform: scale(1.05);
}

.nav-link {
  color: #64748b !important;
  transition: all 0.3s ease;
  border-radius: 25px;
}

.nav-link:hover {
  color: #0d6efd !important;
  background: rgba(13, 110, 253, 0.1);
  transform: translateY(-1px);
}

.nav-link.active {
  background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%) !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(13, 110, 253, 0.3);
}

.navbar-toggler {
  border: none;
  padding: 0.25rem 0.5rem;
}

.navbar-toggler:focus {
  box-shadow: none;
}

@media (max-width: 991px) {
  .navbar-nav {
    padding-top: 1rem;
  }
  
  .nav-item {
    margin: 0.25rem 0;
  }
}

/* Loading Animation */
.fade-in {
  animation: slideInUp 0.6s ease-out;
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

/* Responsive Design */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 1rem;
    margin: 0 0.5rem;
  }
}
</style> 