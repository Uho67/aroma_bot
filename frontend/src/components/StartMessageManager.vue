<template>
  <div class="start-message-manager">
    <h2>Настройки приветственного сообщения</h2>
    
    <div class="form-group">
      <label for="welcomeText">Текст приветствия:</label>
      <textarea
        id="welcomeText"
        v-model="settings.text"
        class="form-control"
        rows="3"
        placeholder="Введите текст приветствия"
      ></textarea>
    </div>

    <div class="form-group">
      <label for="welcomeImage">Изображение приветствия:</label>
      <div class="input-group">
        <input
          type="file"
          id="welcomeImage"
          class="form-control"
          @change="handleFileUpload"
          accept="image/*"
        />
        <button 
          class="btn btn-outline-secondary" 
          type="button"
          @click="uploadImage"
          :disabled="!selectedFile || uploading"
        >
          {{ uploading ? 'Загрузка...' : 'Загрузить' }}
        </button>
      </div>
      <small class="form-text text-muted">
        Поддерживаются форматы: JPG, PNG, GIF
      </small>
    </div>

    <div v-if="settings.image" class="image-preview">
      <img :src="settings.image" alt="Preview" class="img-thumbnail" />
      <button 
        class="btn btn-danger btn-sm mt-2"
        @click="removeImage"
        :disabled="loading"
      >
        Удалить изображение
      </button>
    </div>

    <div class="form-group">
      <button @click="saveSettings" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-if="success" class="alert alert-success">
      Настройки успешно сохранены
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default {
  name: 'StartMessageManager',
  data() {
    return {
      settings: {
        text: '',
        image: null
      },
      selectedFile: null,
      loading: false,
      uploading: false,
      error: null,
      success: false
    };
  },
  async created() {
    await this.loadSettings();
  },
  methods: {
    async loadSettings() {
      try {
        const response = await axios.get(`${API_URL}/api/start-message`);
        this.settings = response.data;
        if (this.settings.image) {
          this.settings.image = `${API_URL}${this.settings.image}`;
        }
      } catch (error) {
        this.error = 'Ошибка при загрузке настроек';
        console.error('Error loading settings:', error);
      }
    },
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
      this.error = null;
    },
    async uploadImage() {
      if (!this.selectedFile) return;

      this.uploading = true;
      this.error = null;

      const formData = new FormData();
      formData.append('image', this.selectedFile);

      try {
        const response = await axios.post(`${API_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        this.settings.image = `${API_URL}${response.data.url}`;
        this.selectedFile = null;
      } catch (error) {
        this.error = 'Ошибка при загрузке изображения';
        console.error('Error uploading image:', error);
      } finally {
        this.uploading = false;
      }
    },
    async removeImage() {
      this.settings.image = null;
      this.selectedFile = null;
    },
    async saveSettings() {
      this.loading = true;
      this.error = null;
      this.success = false;

      try {
        const settingsToSave = {
          ...this.settings,
          image: this.settings.image ? this.settings.image.replace(API_URL, '') : null
        };
        await axios.put(`${API_URL}/api/start-message`, settingsToSave);
        this.success = true;
      } catch (error) {
        this.error = 'Ошибка при сохранении настроек';
        console.error('Error saving settings:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.start-message-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-control {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.input-group {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-outline-secondary {
  background-color: transparent;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}

.image-preview {
  margin: 20px 0;
  text-align: center;
}

.image-preview img {
  max-width: 300px;
  max-height: 300px;
  object-fit: contain;
  border-radius: 4px;
}

.alert {
  margin-top: 20px;
  padding: 12px;
  border-radius: 4px;
}

.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.form-text {
  color: #6c757d;
  font-size: 12px;
  margin-top: 4px;
}
</style> 