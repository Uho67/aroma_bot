<template>
  <div class="configuration-manager">
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-cogs me-2"></i>
          Управление конфигурацией
        </h2>
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="fas fa-plus me-1"></i>
          Добавить конфигурацию
        </button>
      </div>

      <!-- Configurations List -->
      <div class="card shadow-sm">
        <div class="card-header bg-light">
          <h5 class="mb-0">
            <i class="fas fa-list me-2"></i>
            Список конфигураций
          </h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>ID</th>
                  <th>Путь</th>
                  <th>Значение</th>
                  <th>Создано</th>
                  <th>Обновлено</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="configurations.length === 0">
                  <td colspan="6" class="text-center py-4">
                    <div class="text-muted">
                      <i class="fas fa-cogs fa-2x mb-2"></i>
                      <p class="mb-0">Конфигурации не найдены</p>
                      <small>Добавьте первую конфигурацию</small>
                    </div>
                  </td>
                </tr>
                <tr v-for="config in configurations" :key="config.id">
                  <td>{{ config.id }}</td>
                  <td>
                    <span class="badge bg-secondary fs-6">{{ config.path }}</span>
                  </td>
                  <td>
                    <div class="text-truncate" style="max-width: 300px;" :title="config.value">
                      {{ config.value }}
                    </div>
                  </td>
                  <td>
                    <small class="text-muted">
                      {{ new Date(config.createdAt).toLocaleString('ru-RU') }}
                    </small>
                  </td>
                  <td>
                    <small class="text-muted">
                      {{ new Date(config.updatedAt).toLocaleString('ru-RU') }}
                    </small>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm" role="group">
                      <button 
                        class="btn btn-outline-primary" 
                        @click="editConfig(config)"
                        title="Редактировать"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        class="btn btn-outline-danger" 
                        @click="deleteConfig(config.path)"
                        title="Удалить"
                      >
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

      <!-- Add/Edit Modal -->
      <div class="modal fade" :class="{ show: showAddModal || showEditModal }" :style="{ display: (showAddModal || showEditModal) ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-cog me-2"></i>
                {{ isEditing ? 'Редактировать' : 'Добавить' }} конфигурацию
              </h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveConfig">
                <div class="mb-3">
                  <label class="form-label">Путь *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="form.path" 
                    placeholder="admin_url"
                    :disabled="isEditing"
                    required
                  >
                  <div class="form-text">
                    Уникальный идентификатор конфигурации (например: admin_url, channel)
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Значение *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="form.value" 
                    placeholder="https://example.com"
                    required
                  >
                  <div class="form-text">
                    Значение конфигурации (например: URL, настройка)
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Отмена
              </button>
              <button type="button" class="btn btn-primary" @click="saveConfig">
                <i class="fas fa-save me-1"></i>
                {{ isEditing ? 'Обновить' : 'Добавить' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Backdrop -->
      <div 
        v-if="showAddModal || showEditModal" 
        class="modal-backdrop fade show"
        @click="closeModal"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfigurationManager',
  data() {
    return {
      configurations: [],
      showAddModal: false,
      showEditModal: false,
      isEditing: false,
      currentConfig: null,
      form: {
        path: '',
        value: ''
      }
    };
  },
  mounted() {
    this.loadConfigurations();
  },
  methods: {
    async loadConfigurations() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        const response = await fetch(`${API_URL}/api/configurations`);
        if (response.ok) {
          this.configurations = await response.json();
        } else {
          throw new Error('Failed to load configurations');
        }
      } catch (error) {
        console.error('Error loading configurations:', error);
        alert('Ошибка при загрузке конфигураций: ' + error.message);
      }
    },

    editConfig(config) {
      this.currentConfig = config;
      this.form = { ...config };
      this.isEditing = true;
      this.showEditModal = true;
    },

    async saveConfig() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        let response;

        if (this.isEditing) {
          // Update existing config
          response = await fetch(`${API_URL}/api/configurations/${this.form.path}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value: this.form.value })
          });
        } else {
          // Create new config
          response = await fetch(`${API_URL}/api/configurations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.form)
          });
        }

        if (response.ok) {
          const result = await response.json();
          alert(this.isEditing ? 'Конфигурация обновлена!' : 'Конфигурация добавлена!');
          this.closeModal();
          this.loadConfigurations();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save configuration');
        }
      } catch (error) {
        console.error('Error saving configuration:', error);
        alert('Ошибка при сохранении конфигурации: ' + error.message);
      }
    },

    async deleteConfig(path) {
      if (!confirm(`Вы уверены, что хотите удалить конфигурацию "${path}"?`)) {
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        const response = await fetch(`${API_URL}/api/configurations/${path}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Конфигурация удалена!');
          this.loadConfigurations();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete configuration');
        }
      } catch (error) {
        console.error('Error deleting configuration:', error);
        alert('Ошибка при удалении конфигурации: ' + error.message);
      }
    },

    closeModal() {
      this.showAddModal = false;
      this.showEditModal = false;
      this.isEditing = false;
      this.currentConfig = null;
      this.resetForm();
    },

    resetForm() {
      this.form = {
        path: '',
        value: ''
      };
    }
  }
};
</script>

<style scoped>
.configuration-manager {
  padding: 20px;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.table th {
  border-top: none;
  font-weight: 600;
}

.badge {
  font-family: 'Courier New', monospace;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 