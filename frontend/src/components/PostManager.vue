<template>
  <div class="post-manager">
    <h2>Manage Posts</h2>
    
    <!-- Post Creation Form -->
    <div class="post-form">
      <h3>Create New Post</h3>
      <form @submit.prevent="createPost">
        <div class="form-group">
          <label for="image">Image:</label>
          <input 
            type="file" 
            id="image" 
            accept="image/*" 
            @change="handleImageChange"
            required
          >
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="Preview">
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Description:</label>
          <textarea 
            id="description" 
            v-model="description" 
            required
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="link_to_button">Category (Button Value):</label>
          <input 
            type="text" 
            id="link_to_button" 
            v-model="link_to_button" 
            placeholder="e.g., perfume_menu, soap_menu"
          >
          <small class="form-text text-muted">
            Leave empty for general catalog, or enter button value (e.g., "perfume_menu") to categorize this post
          </small>
        </div>
        
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating...' : 'Create Post' }}
        </button>
      </form>
    </div>

    <!-- Posts List -->
    <div class="posts-list">
      <h3>Existing Posts</h3>
      <div v-if="loading" class="loading">Loading posts...</div>
      <div v-else-if="posts.length === 0" class="no-posts">No posts yet</div>
      <div v-else class="posts-grid">
        <div v-for="post in posts" :key="post.id" class="post-card">
          <div class="post-id-badge">ID: {{ post.id }}</div>
          <img :src="post.image" :alt="post.description">
          <p class="description">{{ post.description }}</p>
          <p v-if="post.link_to_button" class="category">
            Category: {{ post.link_to_button }}
          </p>
          <div class="post-actions">
            <button @click="broadcastPost(post.id)" class="broadcast-btn">Добавить в очередь</button>
            <button @click="broadcastToAttentionNeeded(post.id)" class="attention-btn">Отправить нуждающимся</button>
            <button @click="deletePost(post.id)" class="delete-btn">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';

export default {
  name: 'PostManager',
  data() {
    return {
      posts: [],
      description: '',
      link_to_button: '',
      imageFile: null,
      imagePreview: null,
      isSubmitting: false,
      loading: true
    }
  },
  methods: {
    async fetchPosts() {
      try {
        const response = await axios.get(`${API_URL}/api/posts`)
        // Update image URLs to use the full backend URL
        this.posts = response.data.map(post => ({
          ...post,
          image: `${API_URL}${post.image}`
        }))
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        this.loading = false
      }
    },
    handleImageChange(event) {
      const file = event.target.files[0]
      if (file) {
        this.imageFile = file
        this.imagePreview = URL.createObjectURL(file)
      }
    },
    async createPost() {
      if (!this.imageFile || !this.description) return

      this.isSubmitting = true
      const formData = new FormData()
      formData.append('image', this.imageFile)
      formData.append('description', this.description)
      if (this.link_to_button) {
        formData.append('link_to_button', this.link_to_button)
      }

      try {
        const response = await axios.post(`${API_URL}/api/posts`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        // Add the new post with correct image URL
        const newPost = {
          ...response.data,
          image: `${API_URL}${response.data.image}`
        }
        this.posts.unshift(newPost)
        this.resetForm()
      } catch (error) {
        console.error('Error creating post:', error)
        alert('Failed to create post. Please try again.')
      } finally {
        this.isSubmitting = false
      }
    },
    async broadcastPost(id) {
      if (!confirm('Этот пост будет добавлен в очередь для отправки ВСЕМ подписчикам бота. Продолжить?')) return

      try {
        const response = await axios.post(`${API_URL}/api/broadcast/${id}`)
        const result = response.data
        alert(`Пост успешно добавлен в очередь! Добавлено: ${result.addedCount} из ${result.totalUsers} пользователей`)
      } catch (error) {
        console.error('Error adding post to queue:', error)
        const errorMessage = error.response?.data?.error || 'Ошибка при добавлении поста в очередь'
        alert(errorMessage)
      }
    },
    async broadcastToAttentionNeeded(id) {
      if (!confirm('Этот пост будет добавлен в очередь для отправки только пользователям, которым нужно внимание. Продолжить?')) return

      try {
        const response = await axios.post(`${API_URL}/api/broadcast/${id}/attention`)
        const result = response.data
        alert(`Пост успешно добавлен в очередь для нуждающихся! Добавлено: ${result.addedCount} из ${result.totalUsers} пользователей`)
      } catch (error) {
        console.error('Error adding post to attention_needed users queue:', error)
        const errorMessage = error.response?.data?.error || 'Ошибка при добавлении поста в очередь для нуждающихся'
        alert(errorMessage)
      }
    },
    async deletePost(id) {
      if (!confirm('Are you sure you want to delete this post?')) return

      try {
        await axios.delete(`${API_URL}/api/posts/${id}`)
        this.posts = this.posts.filter(post => post.id !== id)
      } catch (error) {
        console.error('Error deleting post:', error)
        alert('Failed to delete post. Please try again.')
      }
    },
    resetForm() {
      this.description = ''
      this.link_to_button = ''
      this.imageFile = null
      this.imagePreview = null
      if (this.$refs.imageInput) {
        this.$refs.imageInput.value = ''
      }
    }
  },
  mounted() {
    this.fetchPosts()
  }
}
</script>

<style scoped>
.post-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.post-form {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

button {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.image-preview {
  margin-top: 10px;
  max-width: 300px;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.post-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
}

.post-id-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
  z-index: 1;
}

.post-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.description {
  padding: 15px;
  margin: 0;
}

.category {
  padding: 0 15px;
  margin: 0;
  font-size: 0.9em;
  color: #666;
  font-style: italic;
}

.post-actions {
  display: flex;
  gap: 10px;
  padding: 10px;
}

.broadcast-btn {
  background: #2196F3;
  flex: 1;
}

.attention-btn {
  background: #ff9800;
  flex: 1;
}

.delete-btn {
  background: #ff4444;
  flex: 1;
}

.loading, .no-posts {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style> 