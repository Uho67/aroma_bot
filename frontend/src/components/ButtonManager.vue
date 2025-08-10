<template>
  <div class="button-manager">
    <h2>Manage Bot Buttons</h2>
    
    <!-- Button Creation Form -->
    <div class="button-form">
      <h3>Add New Button</h3>
      <form @submit.prevent="createButton">
        <div class="form-group">
          <label for="name">Button Name:</label>
          <input 
            type="text" 
            id="name" 
            v-model="newButton.name" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="type">Button Type:</label>
          <select 
            id="type" 
            v-model="newButton.type" 
            required
          >
            <option value="url">URL Link</option>
            <option value="callback">Callback Action</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="value">Value:</label>
          <input 
            type="text" 
            id="value" 
            v-model="newButton.value" 
            required
            :placeholder="newButton.type === 'url' ? 'https://example.com' : 'callback_data'"
          >
        </div>

        <div class="form-group">
          <label for="render_type">Render Type:</label>
          <select 
            id="render_type" 
            v-model="newButton.render_type"
          >
            <option value="admin">Admin link</option>
            <option value="welcome_button">Welcome Button</option>
            <option value="catalog_menu">Catalog Menu</option>
            <option value="order">Заказ</option>
          </select>
        </div>

        <div class="form-group">
          <label for="order">Order:</label>
          <input 
            type="text" 
            id="order" 
            v-model="newButton.order" 
            maxlength="10" 
            required
          >
        </div>

        <button type="submit">Add Button</button>
      </form>
    </div>

    <!-- Button List -->
    <div class="button-list">
      <h3>Existing Buttons</h3>
      <ul>
        <li v-for="button in buttons" :key="button.id">
          <strong>{{ button.name }}</strong> ({{ button.type }}) - {{ button.value }} - {{ button.render_type || 'None' }} - Order: {{ button.order }}
          <button @click="deleteButton(button.id)">Delete</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      buttons: [],
      newButton: {
        name: '',
        type: 'url',
        value: '',
        render_type: '',
        order: ''
      }
    };
  },
  methods: {
    async fetchButtons() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        const response = await axios.get(`${API_URL}/api/buttons`);
        this.buttons = response.data;
      } catch (error) {
        console.error('Error fetching buttons:', error);
      }
    },
    async createButton() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        const response = await axios.post(`${API_URL}/api/buttons`, this.newButton);
        this.buttons.push(response.data);
        this.newButton = { name: '', type: 'url', value: '', render_type: '', order: '' };
      } catch (error) {
        console.error('Error creating button:', error);
      }
    },
    async deleteButton(id) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        await axios.delete(`${API_URL}/api/buttons/${id}`);
        this.buttons = this.buttons.filter(button => button.id !== id);
      } catch (error) {
        console.error('Error deleting button:', error);
      }
    }
  },
  mounted() {
    this.fetchButtons();
  }
};
</script>

<style scoped>
.button-manager {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

button {
  margin-top: 10px;
}
</style>