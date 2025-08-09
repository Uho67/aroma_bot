<template>
  <div class="messages">
    <h1>Messages</h1>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else class="messages-list">
      <div v-for="message in messages" :key="message.id" class="message-card">
        <div class="message-header">
          <span class="username">{{ message.user.username || 'Anonymous' }}</span>
          <span class="timestamp">{{ new Date(message.createdAt).toLocaleString() }}</span>
        </div>
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Messages',
  data() {
    return {
      messages: [],
      loading: true,
      error: null
    }
  },
  async created() {
    try {
      const response = await axios.get('/api/messages')
      this.messages = response.data
    } catch (err) {
      this.error = 'Failed to load messages: ' + err.message
    } finally {
      this.loading = false
    }
  }
}
</script>

<style scoped>
.messages {
  padding: 20px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.message-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.username {
  font-weight: bold;
  color: #2c3e50;
}

.timestamp {
  color: #666;
  font-size: 0.9em;
}

.message-content {
  color: #333;
  line-height: 1.5;
}
</style> 