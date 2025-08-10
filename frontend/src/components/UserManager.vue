<template>
  <div class="user-manager">
          <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Управление пользователями</h2>
        <div class="d-flex gap-2 align-items-center">
          <div v-if="selectedUsers.length > 0" class="d-flex gap-2 align-items-center">
            <!-- Send Post Form -->
            <input 
              v-model="postIdToSend" 
              type="number" 
              class="form-control" 
              placeholder="Post ID"
              style="width: 100px;"
              min="1">
            <button @click="sendPostById" class="btn btn-success" :disabled="!postIdToSend || sendingPost">
              <span v-if="sendingPost" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fas fa-paper-plane"></i>
              {{ sendingPost ? 'Отправка...' : `Отправить (${selectedUsers.length})` }}
            </button>
            
            <!-- Sales Rule Form -->
            <div class="vr mx-2"></div>
            <select v-model="selectedSalesRuleId" class="form-select" style="width: 200px;">
              <option value="">Выберите правило продаж</option>
              <option v-for="rule in salesRules" :key="rule.id" :value="rule.id">
                {{ rule.name }}
              </option>
            </select>
            <button @click="offerPromotion" class="btn btn-warning" :disabled="!selectedSalesRuleId || offeringPromotion">
              <span v-if="offeringPromotion" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fas fa-tags"></i>
              {{ offeringPromotion ? 'Создание...' : 'Предложить акцию' }}
            </button>
          </div>
          <button @click="loadUsers" class="btn btn-outline-primary" :disabled="loading">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
            Обновить
          </button>
        </div>
      </div>

    <div v-if="loading" class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- Users Statistics -->
    <div class="row mb-4" v-if="stats">
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Всего пользователей</h5>
            <h3 class="text-primary">{{ stats.total || users.length }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Активные</h5>
            <h3 class="text-success">{{ stats.active || users.filter(u => !u.is_blocked).length }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Заблокированные</h5>
            <h3 class="text-danger">{{ stats.blocked || users.filter(u => u.is_blocked).length }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Users List -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Список пользователей</h5>
          </div>
          <div class="card-body">
            <!-- Search and Filter Controls -->
            <div class="filter-section mb-4">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-light border-0 d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center">
                    <i class="fas fa-filter text-primary me-2"></i>
                    <h6 class="mb-0 fw-semibold">Фильтры поиска</h6>
                    <span v-if="hasFilterValues" class="badge bg-primary ms-2">{{ activeFiltersCount }}</span>
                  </div>
                  <button 
                    v-if="hasFilterValues" 
                    @click="clearFilters" 
                    class="btn btn-outline-danger btn-sm"
                    title="Сбросить все фильтры">
                    <i class="fas fa-times me-1"></i>
                    Сбросить все
                  </button>
                </div>
                <div class="card-body">
                     <div class="row g-3">
                       <div class="col-md-4">
                         <label class="form-label small text-muted fw-medium">
                           <i class="fas fa-search me-1"></i>Поиск
                         </label>
                         <div class="position-relative">
                           <input 
                             v-model="searchQuery" 
                             type="text" 
                             class="form-control" 
                             placeholder="Имя, username или Chat ID..."
                             @keyup.enter="applyFilters">
                           <button 
                             v-if="searchQuery" 
                             @click="clearSearchQuery" 
                             class="btn btn-sm btn-outline-secondary position-absolute end-0 top-50 translate-middle-y me-1"
                             style="padding: 0.125rem 0.5rem;"
                             title="Очистить поиск">
                             <i class="fas fa-times small"></i>
                           </button>
                         </div>
                       </div>
                       <div class="col-md-2">
                         <label class="form-label small text-muted fw-medium">
                           <i class="fas fa-user-check me-1"></i>Статус
                         </label>
                         <select v-model="statusFilter" class="form-select">
                           <option value="">Все статусы</option>
                           <option value="active">Активные</option>
                           <option value="blocked">Заблокированные</option>
                         </select>
                       </div>
                       <div class="col-md-2">
                         <label class="form-label small text-muted fw-medium">
                           <i class="fas fa-calendar me-1"></i>Дата с
                         </label>
                         <input 
                           v-model="dateFrom" 
                           type="date" 
                           class="form-control">
                       </div>
                       <div class="col-md-2">
                         <label class="form-label small text-muted fw-medium">
                           <i class="fas fa-calendar me-1"></i>Дата по
                         </label>
                         <input 
                           v-model="dateTo" 
                           type="date" 
                           class="form-control">
                       </div>
                       <div class="col-md-2">
                         <label class="form-label small text-muted fw-medium">&nbsp;</label>
                         <div class="d-grid">
                           <button 
                             @click="applyFilters" 
                             class="btn btn-primary" 
                             :disabled="loading">
                             <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                             <i v-else class="fas fa-search me-2"></i>
                             {{ loading ? 'Поиск...' : 'Применить' }}
                           </button>
                         </div>
                       </div>
                     </div>
                     
                                           <!-- Filter Status Bar -->
                      <div v-if="hasFilterValues" class="mt-3 pt-3 border-top">
                       <div class="d-flex flex-wrap gap-2 align-items-center">
                         <small class="text-muted fw-medium">Активные фильтры:</small>
                         <span v-if="searchQuery" class="badge bg-light text-dark border">
                           <i class="fas fa-search me-1"></i>{{ searchQuery }}
                           <button @click="clearSearchQuery" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
                         </span>
                         <span v-if="statusFilter" class="badge bg-light text-dark border">
                           <i class="fas fa-user-check me-1"></i>{{ statusFilter === 'active' ? 'Активные' : 'Заблокированные' }}
                           <button @click="statusFilter = ''" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
                         </span>
                         <span v-if="dateFrom" class="badge bg-light text-dark border">
                           <i class="fas fa-calendar me-1"></i>С {{ formatDateShort(dateFrom) }}
                           <button @click="dateFrom = ''" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
                         </span>
                         <span v-if="dateTo" class="badge bg-light text-dark border">
                           <i class="fas fa-calendar me-1"></i>По {{ formatDateShort(dateTo) }}
                           <button @click="dateTo = ''" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
                         </span>
                       </div>
                     </div>
                     
                     <!-- Results Summary -->
                     <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                       <div class="text-muted small">
                         <i class="fas fa-info-circle me-1"></i>
                         Показано: <strong>{{ users.length }}</strong> из <strong>{{ pagination.total }}</strong> пользователей
                       </div>
                                               <div v-if="hasFilterValues" class="text-muted small">
                          <i class="fas fa-filter me-1"></i>
                          Фильтров активно: <strong>{{ activeFiltersCount }}</strong>
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
               
                              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          :checked="allUsersSelected" 
                          @change="toggleAllUsers"
                          :indeterminate="someUsersSelected"
                          class="form-check-input">
                      </th>
                      <th>ID</th>
                      <th>Имя</th>
                      <th>Username</th>
                      <th>Chat ID</th>
                      <th>Статус</th>
                      <th>Дата регистрации</th>
                      <th>Сообщения</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                                 <tbody>
                                      <tr v-for="user in users" :key="user.id">
                     <td>
                       <input 
                         type="checkbox" 
                         :value="user.chat_id" 
                         v-model="selectedUsers"
                         class="form-check-input">
                     </td>
                     <td>{{ user.id }}</td>
                    <td>
                      {{ user.first_name }} {{ user.last_name }}
                    </td>
                    <td>
                      <span v-if="user.user_name">@{{ user.user_name }}</span>
                      <span v-else class="text-muted">—</span>
                    </td>
                    <td>
                      <code>{{ user.chat_id }}</code>
                    </td>
                    <td>
                      <span v-if="user.is_blocked" class="badge bg-danger">Заблокирован</span>
                      <span v-else class="badge bg-success">Активен</span>
                    </td>
                    <td>
                      {{ formatDate(user.createdAt) }}
                    </td>
                    <td>
                      <span class="badge bg-info">{{ user.messages ? user.messages.length : 0 }}</span>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button 
                          v-if="!user.is_blocked" 
                          @click="blockUser(user.chat_id)" 
                          class="btn btn-outline-danger"
                          title="Заблокировать">
                          <i class="fas fa-ban"></i>
                        </button>
                        <button 
                          v-else 
                          @click="unblockUser(user.chat_id)" 
                          class="btn btn-outline-success"
                          title="Разблокировать">
                          <i class="fas fa-check"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                                 </tbody>
               </table>
             </div>
             
             <!-- No Users Found Message -->
             <div v-if="users.length === 0 && !loading" class="text-center text-muted py-5">
               <i class="fas fa-users fa-3x mb-3 text-muted"></i>
               <h5>Пользователи не найдены</h5>
               <p v-if="hasFilterValues">Попробуйте изменить фильтры поиска</p>
               <p v-else>В системе пока нет пользователей</p>
             </div>
             
             <!-- Pagination Controls -->
             <div class="d-flex justify-content-between align-items-center mt-3" v-if="totalPages > 1">
               <div class="text-muted small">
                 Страница {{ currentPage }} из {{ totalPages }}
               </div>
               <nav>
                 <ul class="pagination pagination-sm mb-0">
                   <li class="page-item" :class="{ disabled: currentPage === 1 }">
                     <button class="page-link" @click="currentPage = 1" :disabled="currentPage === 1">
                       Первая
                     </button>
                   </li>
                   <li class="page-item" :class="{ disabled: currentPage === 1 }">
                     <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                       Предыдущая
                     </button>
                   </li>
                   
                   <!-- Page numbers -->
                   <li v-for="page in visiblePages" :key="page" 
                       class="page-item" :class="{ active: page === currentPage }">
                     <button class="page-link" @click="currentPage = page">
                       {{ page }}
                     </button>
                   </li>
                   
                   <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                     <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
                       Следующая
                     </button>
                   </li>
                   <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                     <button class="page-link" @click="currentPage = totalPages" :disabled="currentPage === totalPages">
                       Последняя
                     </button>
                   </li>
                 </ul>
               </nav>
             </div>
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
  name: 'UserManager',
  data() {
    return {
      users: [],
      stats: null,
      loading: false,
      error: null,
      currentPage: 1,
      itemsPerPage: 50,
      searchQuery: '',
      statusFilter: '',
      dateFrom: '',
      dateTo: '',
      pagination: {
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      },
      searchTimeout: null,
      selectedUsers: [],
      postIdToSend: '',
      sendingPost: false,
      sendError: null,
      salesRules: [],
      selectedSalesRuleId: '',
      offeringPromotion: false
    };
  },
  async created() {
    await Promise.all([
      this.loadUsers(),
      this.loadSalesRules()
    ]);
  },
  computed: {
    totalPages() {
      return this.pagination.totalPages;
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;
      
      // Show up to 5 page numbers
      let start = Math.max(1, current - 2);
      let end = Math.min(total, start + 4);
      
      // Adjust start if we're near the end
      if (end - start < 4) {
        start = Math.max(1, end - 4);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    },
    hasActiveFilters() {
      return this.searchQuery.trim() || 
             this.statusFilter || 
             this.dateFrom || 
             this.dateTo;
    },
    hasFilterValues() {
      return this.searchQuery.trim() || 
             this.statusFilter || 
             this.dateFrom || 
             this.dateTo;
    },
    activeFiltersCount() {
      let count = 0;
      if (this.searchQuery.trim()) count++;
      if (this.statusFilter) count++;
      if (this.dateFrom) count++;
      if (this.dateTo) count++;
      return count;
    },
    allUsersSelected() {
      return this.users.length > 0 && this.selectedUsers.length === this.users.length;
    },
    someUsersSelected() {
      return this.selectedUsers.length > 0 && this.selectedUsers.length < this.users.length;
    }
  },
  watch: {
    currentPage() {
      this.loadUsers();
    }
  },
  methods: {
    async loadUsers() {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          page: this.currentPage,
          limit: this.itemsPerPage
        };
        
        if (this.searchQuery.trim()) {
          params.search = this.searchQuery.trim();
        }
        
        if (this.statusFilter) {
          params.status = this.statusFilter;
        }
        
        if (this.dateFrom) {
          params.dateFrom = this.dateFrom;
        }
        
        if (this.dateTo) {
          params.dateTo = this.dateTo;
        }
        
        const response = await axios.get(`${API_URL}/api/users`, { params });
        this.users = response.data.users;
        this.pagination = response.data.pagination;
      } catch (error) {
        this.error = 'Ошибка при загрузке пользователей';
        console.error('Error loading users:', error);
      } finally {
        this.loading = false;
      }
    },
    async blockUser(chatId) {
      try {
        await axios.put(`${API_URL}/api/users/${chatId}/block`, { is_blocked: true });
        await this.loadUsers(); // Reload users
      } catch (error) {
        this.error = 'Ошибка при блокировке пользователя';
        console.error('Error blocking user:', error);
      }
    },
    async unblockUser(chatId) {
      try {
        await axios.put(`${API_URL}/api/users/${chatId}/block`, { is_blocked: false });
        await this.loadUsers(); // Reload users
      } catch (error) {
        this.error = 'Ошибка при разблокировке пользователя';
        console.error('Error unblocking user:', error);
      }
    },
          applyFilters() {
        this.currentPage = 1;
        this.loadUsers();
      },
      clearFilters() {
        this.searchQuery = '';
        this.statusFilter = '';
        this.dateFrom = '';
        this.dateTo = '';
        this.currentPage = 1;
        this.loadUsers();
      },
      clearSearchQuery() {
        this.searchQuery = '';
        this.applyFilters();
      },
      toggleAllUsers() {
        if (this.allUsersSelected) {
          this.selectedUsers = [];
        } else {
          this.selectedUsers = this.users.map(user => user.chat_id);
        }
      },
      async sendPostById() {
        if (!this.postIdToSend || this.selectedUsers.length === 0) return;
        
        this.sendingPost = true;
        this.sendError = null;
        
        try {
          const response = await axios.post(`${API_URL}/api/broadcast/custom`, {
            postId: parseInt(this.postIdToSend),
            userIds: this.selectedUsers
          });
          
          // Show success message
          alert(`Пост ID ${this.postIdToSend} успешно отправлен ${response.data.sentCount} из ${this.selectedUsers.length} пользователям!`);
          
          // Clear selection and post ID
          this.selectedUsers = [];
          this.postIdToSend = '';
          
        } catch (error) {
          console.error('Error sending post:', error);
          if (error.response?.status === 404) {
            alert(`Пост с ID ${this.postIdToSend} не найден!`);
          } else {
            alert('Ошибка при отправке поста');
          }
        } finally {
          this.sendingPost = false;
        }
      },
      
      async loadSalesRules() {
        try {
          const response = await axios.get(`${API_URL}/api/sales-rules`);
          this.salesRules = response.data;
        } catch (error) {
          console.error('Error loading sales rules:', error);
        }
      },
      
      async offerPromotion() {
        if (!this.selectedSalesRuleId || this.selectedUsers.length === 0) return;
        
        this.offeringPromotion = true;
        
        try {
          const response = await axios.post(`${API_URL}/api/sales-rules/${this.selectedSalesRuleId}/send`, {
            userIds: this.selectedUsers
          });
          
          if (response.data.success) {
            alert(`Акция успешно предложена ${this.selectedUsers.length} пользователям! Создано ${response.data.couponCodesCount} купонов.`);
            // Clear selection
            this.selectedUsers = [];
            this.selectedSalesRuleId = '';
          } else {
            alert('Ошибка при создании купонов');
          }
        } catch (error) {
          console.error('Error offering promotion:', error);
          alert('Ошибка при предложении акции: ' + (error.response?.data?.error || error.message));
        } finally {
          this.offeringPromotion = false;
        }
      },
      formatDate(dateString) {
        const date = new Date(dateString);
        // Format UTC date without timezone conversion
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        return `${day}.${month}.${year} ${hours}:${minutes}`;
      },
      formatDateShort(dateString) {
        const date = new Date(dateString);
        // Format UTC date without timezone conversion
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        
        return `${day}.${month}.${year}`;
      }
        }
};
</script>

<style scoped>
.user-manager {
  max-width: 1200px;
  margin: 0 auto;
}

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.badge {
  font-size: 0.75em;
}

code {
  font-size: 0.85em;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.card-title {
  font-size: 0.9rem;
  color: #6c757d;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.pagination .page-link {
  color: #0d6efd;
  border-color: #dee2e6;
}

.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.pagination .page-item.disabled .page-link {
  color: #6c757d;
  background-color: #fff;
  border-color: #dee2e6;
}

.form-control:focus, .form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.filter-section .card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.filter-section .card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.filter-section .card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.filter-section .badge.bg-light {
  background-color: #f8f9fa !important;
  color: #495057 !important;
  border: 1px solid #dee2e6;
  font-weight: 500;
}

.filter-section .badge .btn-close {
  background: none;
  border: none;
  font-size: 0.6em;
  opacity: 0.6;
}

.filter-section .badge .btn-close:hover {
  opacity: 1;
}

.position-relative .btn {
  border: none;
  background: transparent;
}

.position-relative .btn:hover {
  background: rgba(108, 117, 125, 0.1);
}
</style> 