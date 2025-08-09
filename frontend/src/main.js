import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Users from './views/Users.vue'
import Messages from './views/Messages.vue'
import PostsView from './views/PostsView.vue'
import ButtonsView from './views/ButtonsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/users' },
    { path: '/users', component: Users },
    { path: '/messages', component: Messages },
    { path: '/posts', component: PostsView },
    { path: '/buttons', component: ButtonsView }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app') 