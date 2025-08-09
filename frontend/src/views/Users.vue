<template>
  <div class="users">
    <h1>Registered Users</h1>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else class="users-grid">
      <div v-for="user in users" :key="user.id" class="user-card">
        <h3>{{ user.username || 'Anonymous' }}</h3>
        <p>Telegram ID: {{ user.telegramId }}</p>
        <p>Messages: {{ user.messages.length }}</p>
        <p>Joined: {{ new Date(user.createdAt).toLocaleDateString() }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Users',
  data() {
    return {
      users: [],
      loading: true,
      error: null
    }
  },
  async created() {
    try {
      const response = await axios.get('/api/users')
      this.users = response.data
    } catch (err) {
      this.error = 'Failed to load users: ' + err.message
    } finally {
      this.loading = false
    }
  }
}
</script>

<style scoped>
.users {
  padding: 20px;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.user-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-card h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.user-card p {
  margin: 5px 0;
  color: #666;
}
</style> 