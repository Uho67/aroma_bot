<template>
  <div class="sales-rule-manager">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">
        <i class="fas fa-tags text-primary me-2"></i>
        Управление правилами продаж
      </h2>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <i class="fas fa-plus me-2"></i>
        Создать правило
      </button>
    </div>

    <!-- Sales Rules List -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Ссылка админа</th>
                <th>Изображение</th>
                <th>Макс. использований</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in salesRules" :key="rule.id">
                <td>{{ rule.id }}</td>
                <td>{{ rule.name }}</td>
                <td>{{ rule.description || '-' }}</td>
                <td>
                  <a v-if="rule.admin_link" :href="rule.admin_link" target="_blank" class="text-decoration-none">
                    <i class="fas fa-external-link-alt me-1"></i>
                    Ссылка
                  </a>
                  <span v-else class="text-muted">Нет</span>
                </td>
                <td>
                  <img v-if="rule.image" :src="rule.image" alt="Rule image" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">
                  <span v-else class="text-muted">Нет</span>
                </td>
                <td>{{ rule.max_uses }}</td>
                <td>{{ formatDate(rule.createdAt) }}</td>
                <td>
                  <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" @click="editRule(rule)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" @click="sendToUsers(rule)">
                      <i class="fas fa-paper-plane"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteRule(rule.id)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal fade" :class="{ show: showCreateModal || showEditModal }" :style="{ display: (showCreateModal || showEditModal) ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ showEditModal ? 'Редактировать правило' : 'Создать новое правило' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveRule">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Название *</label>
                  <input type="text" class="form-control" v-model="form.name" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Максимум использований *</label>
                  <input type="number" class="form-control" v-model="form.max_uses" min="1" required>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea class="form-control" v-model="form.description" rows="3"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Ссылка для админа</label>
                <input type="url" class="form-control" v-model="form.admin_link" placeholder="https://example.com">
              </div>
              <div class="mb-3">
                <label class="form-label">Изображение</label>
                <input 
                  type="file" 
                  class="form-control" 
                  accept="image/*" 
                  @change="handleImageChange"
                  ref="imageInput"
                >
                <div v-if="imagePreview" class="image-preview mt-2">
                  <img :src="imagePreview" alt="Preview" style="max-width: 200px; max-height: 200px; object-fit: cover;">
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="closeModal">Отмена</button>
                <button type="submit" class="btn btn-primary">
                  {{ showEditModal ? 'Обновить' : 'Создать' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Send to Users Modal -->
    <div class="modal fade" :class="{ show: showSendModal }" :style="{ display: showSendModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Отправить правило пользователям</h5>
            <button type="button" class="btn-close" @click="showSendModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Выберите пользователей</label>
              <div class="user-selection">
                <div v-for="user in users" :key="user.id" class="form-check">
                  <input class="form-check-input" type="checkbox" :value="user.id" :id="'user-' + user.id" v-model="selectedUsers">
                  <label class="form-check-label" :for="'user-' + user.id">
                    {{ user.first_name || user.user_name || user.chat_id }}
                  </label>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary" @click="showSendModal = false">Отмена</button>
              <button type="button" class="btn btn-primary" @click="confirmSend" :disabled="selectedUsers.length === 0">
                Отправить ({{ selectedUsers.length }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="showCreateModal || showEditModal || showSendModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script>
export default {
  name: 'SalesRuleManager',
  data() {
    return {
      salesRules: [],
      users: [],
      showCreateModal: false,
      showEditModal: false,
      showSendModal: false,
      selectedUsers: [],
      currentRule: null,
      form: {
        name: '',
        description: '',
        image: '',
        admin_link: '',
        max_uses: 1
      },
      imageFile: null,
      imagePreview: null
    };
  },
  async mounted() {
    await this.loadSalesRules();
    await this.loadUsers();
  },
  methods: {
      async loadSalesRules() {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
      const response = await fetch(`${API_URL}/api/sales-rules`);
      const data = await response.json();
      // Update image URLs to use the full backend URL
      this.salesRules = data.map(rule => ({
        ...rule,
        image: rule.image ? `${API_URL}${rule.image}` : null
      }));
    } catch (error) {
      console.error('Error loading sales rules:', error);
    }
  },
  async loadUsers() {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
      const response = await fetch(`${API_URL}/api/users`);
      const data = await response.json();
      this.users = data.users;
    } catch (error) {
      console.error('Error loading users:', error);
    }
  },
    handleImageChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.imageFile = file;
        this.imagePreview = URL.createObjectURL(file);
      }
    },
    editRule(rule) {
      this.currentRule = rule;
      this.form = { ...rule };
      this.imagePreview = rule.image || null;
      this.imageFile = null;
      this.showEditModal = true;
    },
    async saveRule() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        
        // If there's a new image file, upload it first
        let imageUrl = this.form.image;
        if (this.imageFile) {
          const formData = new FormData();
          formData.append('image', this.imageFile);
          
          const uploadResponse = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            imageUrl = uploadResult.url;
          } else {
            throw new Error('Failed to upload image');
          }
        }
        
        const url = this.showEditModal 
          ? `${API_URL}/api/sales-rules/${this.currentRule.id}`
          : `${API_URL}/api/sales-rules`;
        
        const method = this.showEditModal ? 'PUT' : 'POST';
        
        const ruleData = {
          ...this.form,
          image: imageUrl
        };
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleData)
        });

        if (response.ok) {
          await this.loadSalesRules();
          this.closeModal();
          this.resetForm();
        }
      } catch (error) {
        console.error('Error saving rule:', error);
        alert('Ошибка при сохранении правила: ' + error.message);
      }
    },
    async deleteRule(id) {
      if (confirm('Вы уверены, что хотите удалить это правило?')) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
          const response = await fetch(`${API_URL}/api/sales-rules/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            await this.loadSalesRules();
          }
        } catch (error) {
          console.error('Error deleting rule:', error);
        }
      }
    },
    sendToUsers(rule) {
      this.currentRule = rule;
      this.selectedUsers = [];
      this.showSendModal = true;
    },
    async confirmSend() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        const response = await fetch(`${API_URL}/api/sales-rules/${this.currentRule.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: this.selectedUsers })
        });

        if (response.ok) {
          this.showSendModal = false;
          alert('Правило успешно отправлено пользователям!');
        }
      } catch (error) {
        console.error('Error sending rule:', error);
      }
    },
    closeModal() {
      this.showCreateModal = false;
      this.showEditModal = false;
      this.showSendModal = false;
      this.resetForm();
    },
    resetForm() {
      this.form = {
        name: '',
        description: '',
        image: '',
        admin_link: '',
        max_uses: 1
      };
      this.currentRule = null;
      this.imageFile = null;
      this.imagePreview = null;
      if (this.$refs.imageInput) {
        this.$refs.imageInput.value = '';
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('ru-RU');
    }
  }
};
</script>

<style scoped>
.sales-rule-manager {
  padding: 20px;
}

.user-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 15px;
}

.form-check {
  margin-bottom: 8px;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style> 