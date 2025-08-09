<template>
  <div class="app">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">Telegram Bot Admin</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" href="#" @click.prevent="currentView = 'posts'">Посты</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" @click.prevent="currentView = 'buttons'">Кнопки</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" @click.prevent="currentView = 'start-message'">Приветствие</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" @click.prevent="currentView = 'admins'">Администраторы</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <PostManager v-if="currentView === 'posts'" />
      <ButtonManager v-if="currentView === 'buttons'" />
      <StartMessageManager v-if="currentView === 'start-message'" />
      <AdminManager v-if="currentView === 'admins'" />
    </div>
  </div>
</template>

<script>
import PostManager from './components/PostManager.vue';
import ButtonManager from './components/ButtonManager.vue';
import StartMessageManager from './components/StartMessageManager.vue';
import AdminManager from './components/AdminManager.vue';

export default {
  name: 'App',
  components: {
    PostManager,
    ButtonManager,
    StartMessageManager,
    AdminManager
  },
  data() {
    return {
      currentView: 'posts'
    };
  }
};
</script>

<style>
.app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

nav {
  padding: 20px 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}

nav a {
  margin: 0 10px;
  text-decoration: none;
  color: #2c3e50;
}

nav a.router-link-active {
  color: #42b983;
  font-weight: bold;
}

main {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style> 