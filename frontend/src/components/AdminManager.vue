<template>
  <div class="admin-manager">
    <h2>Управление администраторами</h2>
    
    <!-- Add Admin Form -->
    <div class="card mb-4">
      <div class="card-header">
        <h5>Добавить администратора</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="addAdmin">
          <div class="mb-3">
            <label for="username" class="form-label">Имя пользователя</label>
            <input
              type="text"
              class="form-control"
              id="username"
              v-model="newAdmin.username"
              placeholder="Введите имя пользователя"
              required
            />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Добавление...' : 'Добавить администратора' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Admins List -->
    <div class="card">
      <div class="card-header">
        <h5>Список администраторов</h5>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
        </div>
        
        <div v-else-if="admins.length === 0" class="text-center text-muted">
          <p>Администраторы не найдены</p>
        </div>
        
        <div v-else class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="admin in admins" :key="admin.id">
                <td>{{ admin.id }}</td>
                <td>{{ admin.user_name }}</td>
                <td>{{ formatDate(admin.createdAt) }}</td>
                <td>
                  <button
                    @click="deleteAdmin(admin.id)"
                    class="btn btn-danger btn-sm"
                    :disabled="deletingAdmin === admin.id"
                  >
                    {{ deletingAdmin === admin.id ? 'Удаление...' : 'Удалить' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminManager',
  data() {
    return {
      admins: [],
      newAdmin: {
        username: ''
      },
      loading: false,
      deletingAdmin: null
    };
  },
  async mounted() {
    await this.loadAdmins();
  },
  methods: {
    async loadAdmins() {
      this.loading = true;
      try {
        const response = await axios.get('/api/admins');
        this.admins = response.data;
      } catch (error) {
        console.error('Error loading admins:', error);
        alert('Ошибка при загрузке администраторов');
      } finally {
        this.loading = false;
      }
    },

    async addAdmin() {
      if (!this.newAdmin.username.trim()) return;
      
      this.loading = true;
      try {
        const response = await axios.post('/api/admins', {
          user_name: this.newAdmin.username.trim()
        });

        this.newAdmin.username = '';
        await this.loadAdmins();
      } catch (error) {
        console.error('Error adding admin:', error);
        const errorMessage = error.response?.data?.error || 'Ошибка при добавлении администратора';
        alert(errorMessage);
      } finally {
        this.loading = false;
      }
    },

    async deleteAdmin(id) {
      if (!confirm('Вы уверены, что хотите удалить этого администратора?')) {
        return;
      }

      this.deletingAdmin = id;
      try {
        await axios.delete(`/api/admins/${id}`);
        await this.loadAdmins();
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('Ошибка при удалении администратора');
      } finally {
        this.deletingAdmin = null;
      }
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString('ru-RU');
    }
  }
};
</script>

<style scoped>
.admin-manager {
  max-width: 800px;
  margin: 0 auto;
}

.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 8px;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  border-radius: 8px 8px 0 0 !important;
}

.table th {
  border-top: none;
  font-weight: 600;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style> 