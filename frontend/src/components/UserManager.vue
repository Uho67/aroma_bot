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
            
            <!-- Subscription Check Button -->
            <div class="vr mx-2"></div>
            <button @click="checkSubscriptions" class="btn btn-info" :disabled="selectedUsers.length === 0 || checkingSubscriptions">
              <span v-if="checkingSubscriptions" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="fas fa-bell"></i>
              {{ checkingSubscriptions ? 'Проверка...' : `Проверить подписку (${selectedUsers.length})` }}
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
                           <i class="fas fa-bell me-1"></i>Подписка
                         </label>
                         <select v-model="subscriptionFilter" class="form-select">
                           <option value="">Все</option>
                           <option value="subscribed">Подписанные</option>
                           <option value="not_subscribed">Не подписанные</option>
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
                         <label class="form-label small text-muted fw-medium">
                           <i class="fas fa-clock me-1"></i>Обновление с
                         </label>
                         <input 
                           v-model="updatedFrom" 
                           type="date" 
                           class="form-control">
                       </div>
                       <div class="col-md-2">
                         <label class="form-label small text-muted fw-medium">
                           <i class="fas fa-clock me-1"></i>Обновление по
                         </label>
                         <input 
                           v-model="updatedTo" 
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
                         <span v-if="subscriptionFilter" class="badge bg-light text-dark border">
                           <i class="fas fa-bell me-1"></i>{{ subscriptionFilter === 'subscribed' ? 'Подписанные' : 'Не подписанные' }}
                           <button @click="subscriptionFilter = ''" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
                         </span>
                         <span v-if="dateFrom" class="badge bg-light text-dark border">
                           <i class="fas fa-calendar me-1"></i>С {{ formatDateShort(dateFrom) }}
                           <button @click="dateFrom = ''" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
                         </span>
                         <span v-if="dateTo" class="badge bg-light text-dark border">
                           <i class="fas fa-calendar me-1"></i>По {{ formatDateShort(dateTo) }}
                           <button @click="dateTo = ''" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
                         </span>
                         <span v-if="updatedFrom" class="badge bg-light text-dark border">
                           <i class="fas fa-clock me-1"></i>Обновление с {{ formatDateShort(updatedFrom) }}
                           <button @click="updatedFrom = ''" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
                         </span>
                         <span v-if="updatedTo" class="badge bg-light text-dark border">
                           <i class="fas fa-clock me-1"></i>Обновление по {{ formatDateShort(updatedTo) }}
                           <button @click="updatedTo = ''" class="btn-close btn-close-sm ms-1" style="font-size: 0.6em;"></button>
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
                      <th>Подписка</th>
                      <th>Правила продаж</th>
                      <th>Дата регистрации</th>
                      <th>Последнее обновление</th>
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
                      <span v-if="user.is_subscriber" class="badge bg-success">
                        <i class="fas fa-check-circle me-1"></i>Подписан
                      </span>
                      <span v-else class="badge bg-secondary">
                        <i class="fas fa-times-circle me-1"></i>Не подписан
                      </span>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div v-if="user.userSalesRules && user.userSalesRules.length > 0" class="me-2">
                          <div class="mb-1 d-flex justify-content-between align-items-center">
                            <small class="text-muted">ID правил:</small>
                            <span class="badge bg-info small">{{ user.userSalesRules.length }} правил</span>
                          </div>
                          <div class="d-flex flex-wrap gap-1">
                            <span v-for="rule in user.userSalesRules" 
                                  :key="rule.id" 
                                  class="badge bg-secondary small"
                                  :title="rule.salesRule.name">
                              {{ rule.salesRule.id }}
                            </span>
                          </div>
                        </div>
                        <button 
                          @click="editSalesRules(user)" 
                          class="btn btn-sm btn-outline-primary"
                          title="Редактировать правила продаж">
                          <i class="fas fa-edit"></i>
                        </button>
                      </div>
                    </td>
                    <td>
                      {{ formatDate(user.createdAt) }}
                    </td>
                    <td>
                      <span class="text-muted small">
                        {{ formatDate(user.updatedAt) }}
                      </span>
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
                        <button 
                          @click="checkSingleSubscription(user.chat_id)" 
                          class="btn btn-outline-info"
                          title="Проверить подписку">
                          <i class="fas fa-bell"></i>
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
   
   <!-- Subscription Results Modal -->
   <div v-if="subscriptionResults" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
     <div class="modal-dialog modal-lg">
       <div class="modal-content">
         <div class="modal-header">
           <h5 class="modal-title">
             <i class="fas fa-bell text-info me-2"></i>
             Результаты проверки подписки
           </h5>
           <button type="button" class="btn-close" @click="subscriptionResults = null"></button>
         </div>
         <div class="modal-body">
           <div class="row mb-3">
             <div class="col-md-6">
               <div class="card text-center">
                 <div class="card-body">
                   <h6 class="card-title">Подписанные</h6>
                   <h3 class="text-success">{{ subscriptionResults.subscribed?.length || 0 }}</h3>
                 </div>
               </div>
             </div>
             <div class="col-md-6">
               <div class="card text-center">
                 <div class="card-body">
                   <h6 class="card-title">Не подписанные</h6>
                   <h3 class="text-danger">{{ subscriptionResults.notSubscribed?.length || 0 }}</h3>
                 </div>
               </div>
             </div>
           </div>
           
           <!-- Subscribed Users -->
           <div v-if="subscriptionResults.subscribed && subscriptionResults.subscribed.length > 0" class="mb-4">
             <h6 class="text-success mb-3">
               <i class="fas fa-check-circle me-2"></i>
               Подписанные пользователи ({{ subscriptionResults.subscribed.length }})
             </h6>
             <div class="table-responsive">
               <table class="table table-sm table-success">
                 <thead>
                   <tr>
                     <th>Имя</th>
                     <th>Username</th>
                     <th>Chat ID</th>
                     <th>Статус</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr v-for="user in subscriptionResults.subscribed" :key="user.chatId">
                     <td>{{ user.firstName }} {{ user.lastName }}</td>
                     <td>
                       <span v-if="user.userName">@{{ user.userName }}</span>
                       <span v-else class="text-muted">—</span>
                     </td>
                     <td><code>{{ user.chatId }}</code></td>
                     <td>
                       <span class="badge bg-success">{{ user.status }}</span>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
           
           <!-- Not Subscribed Users -->
           <div v-if="subscriptionResults.notSubscribed && subscriptionResults.notSubscribed.length > 0" class="mb-4">
             <h6 class="text-danger mb-3">
               <i class="fas fa-times-circle me-2"></i>
               Не подписанные пользователи ({{ subscriptionResults.notSubscribed.length }})
             </h6>
             <div class="table-responsive">
               <table class="table table-sm table-danger">
                 <thead>
                   <tr>
                     <th>Имя</th>
                     <th>Username</th>
                     <th>Chat ID</th>
                     <th>Ошибка</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr v-for="user in subscriptionResults.notSubscribed" :key="user.chatId">
                     <td>{{ user.firstName }} {{ user.lastName }}</td>
                     <td>
                       <span v-if="user.userName">@{{ user.userName }}</span>
                       <span v-else class="text-muted">—</span>
                     </td>
                     <td><code>{{ user.chatId }}</code></td>
                     <td>
                       <small class="text-danger">{{ user.error || 'Не подписан' }}</small>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
           
           <!-- Channel Info -->
           <div v-if="subscriptionResults.channelInfo" class="mt-4 p-3 bg-light rounded">
             <h6 class="mb-2">
               <i class="fas fa-info-circle me-2"></i>
               Информация о канале
             </h6>
             <div class="row">
               <div class="col-md-6">
                 <strong>Название:</strong> {{ subscriptionResults.channelInfo.title }}
               </div>
               <div class="col-md-6">
                 <strong>Username:</strong> @{{ subscriptionResults.channelInfo.username }}
               </div>
             </div>
           </div>
         </div>
         <div class="modal-footer">
           <button type="button" class="btn btn-secondary" @click="subscriptionResults = null">
             Закрыть
           </button>
         </div>
       </div>
     </div>
   </div>
   
   <!-- Sales Rules Editing Modal -->
   <div v-if="salesRulesModal" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
     <div class="modal-dialog">
       <div class="modal-content">
         <div class="modal-header">
           <h5 class="modal-title">
             <i class="fas fa-tags text-primary me-2"></i>
             Редактировать правила продаж пользователя
           </h5>
           <button type="button" class="btn-close" @click="closeSalesRulesModal"></button>
         </div>
         <div class="modal-body">
           <div class="mb-3">
             <label class="form-label">
               <strong>{{ editingSalesRules?.first_name }} {{ editingSalesRules?.last_name }}</strong>
               <br>
               <small class="text-muted">Chat ID: {{ editingSalesRules?.chat_id }}</small>
             </label>
           </div>
           
           <div class="mb-3">
             <label class="form-label">Правила продаж (ID через запятую)</label>
             <textarea 
               v-model="editingSalesRules.sales_rules" 
               class="form-control" 
               rows="4"
               placeholder="Введите ID правил продаж через запятую, например: 1,2,3">
             </textarea>
             <div class="form-text">
               Введите ID правил продаж через запятую. Оставьте пустым, чтобы очистить.
             </div>
           </div>
           
           <div v-if="editingSalesRules?.sales_rules" class="mb-3">
             <label class="form-label">Текущие правила продаж:</label>
             <div class="p-2 bg-light rounded">
               <span v-for="(id, index) in editingSalesRules.sales_rules.split(',').filter(id => id.trim())" 
                     :key="index" 
                     class="badge bg-info me-1 mb-1">
                 ID: {{ id.trim() }}
               </span>
             </div>
           </div>
         </div>
         <div class="modal-footer">
           <button type="button" class="btn btn-secondary" @click="closeSalesRulesModal">
             Отмена
           </button>
           <button type="button" class="btn btn-primary" @click="saveSalesRules">
             <i class="fas fa-save me-1"></i>
             Сохранить
           </button>
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
      itemsPerPage: 100,
      searchQuery: '',
      statusFilter: '',
      subscriptionFilter: '',
      dateFrom: '',
      dateTo: '',
      updatedFrom: '',
      updatedTo: '',
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
      offeringPromotion: false,
      checkingSubscriptions: false,
      subscriptionResults: null,
      editingSalesRules: null,
      salesRulesModal: false
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
             this.subscriptionFilter || 
             this.dateFrom || 
             this.dateTo ||
             this.updatedFrom ||
             this.updatedTo;
    },
    activeFiltersCount() {
      let count = 0;
      if (this.searchQuery.trim()) count++;
      if (this.statusFilter) count++;
      if (this.subscriptionFilter) count++;
      if (this.dateFrom) count++;
      if (this.dateTo) count++;
      if (this.updatedFrom) count++;
      if (this.updatedTo) count++;
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
        
        if (this.subscriptionFilter) {
          params.subscription = this.subscriptionFilter;
        }
        
        if (this.dateFrom) {
          params.dateFrom = this.dateFrom;
        }
        
        if (this.dateTo) {
          params.dateTo = this.dateTo;
        }
        
        if (this.updatedFrom) {
          params.updatedFrom = this.updatedFrom;
        }
        
        if (this.updatedTo) {
          params.updatedTo = this.updatedTo;
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
        this.subscriptionFilter = '';
        this.dateFrom = '';
        this.dateTo = '';
        this.updatedFrom = '';
        this.updatedTo = '';
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
      
      async checkSubscriptions() {
        if (this.selectedUsers.length === 0) {
          alert('Пожалуйста, выберите пользователей для проверки подписки.');
          return;
        }

        this.checkingSubscriptions = true;
        this.subscriptionResults = null;

        try {
          const response = await axios.post(`${API_URL}/api/users/check-subscriptions`, {
            userIds: this.selectedUsers
          });
          this.subscriptionResults = response.data;
        } catch (error) {
          console.error('Error checking subscriptions:', error);
          alert('Ошибка при проверке подписки: ' + (error.response?.data?.error || error.message));
        } finally {
          this.checkingSubscriptions = false;
        }
      },

      async checkSingleSubscription(chatId) {
        this.checkingSubscriptions = true;
        this.subscriptionResults = null;

        try {
          const response = await axios.post(`${API_URL}/api/users/${chatId}/check-subscription`);
          this.subscriptionResults = response.data;
        } catch (error) {
          console.error('Error checking single subscription:', error);
          alert('Ошибка при проверке подписки: ' + (error.response?.data?.error || error.message));
        } finally {
          this.checkingSubscriptions = false;
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
      },
      
      editSalesRules(user) {
        // Convert userSalesRules to comma-separated string for editing
        const salesRulesString = user.userSalesRules 
          ? user.userSalesRules.map(rule => rule.salesRule.id).join(',')
          : '';
        
        this.editingSalesRules = { 
          ...user, 
          sales_rules: salesRulesString 
        };
        this.salesRulesModal = true;
      },
      
      async saveSalesRules() {
        if (!this.editingSalesRules) return;
        
        try {
          const response = await axios.put(`${API_URL}/api/users/${this.editingSalesRules.chat_id}/sales-rules`, {
            sales_rules: this.editingSalesRules.sales_rules
          });
          
          if (response.data.success) {
            // Update the user in the local list
            const userIndex = this.users.findIndex(u => u.chat_id === this.editingSalesRules.chat_id);
            if (userIndex !== -1) {
              this.users[userIndex].sales_rules = this.editingSalesRules.sales_rules;
            }
            
            this.salesRulesModal = false;
            this.editingSalesRules = null;
          }
        } catch (error) {
          console.error('Error updating sales_rules:', error);
          alert('Ошибка при обновлении правил продаж: ' + (error.response?.data?.error || error.message));
        }
      },
      
      closeSalesRulesModal() {
        this.salesRulesModal = false;
        this.editingSalesRules = null;
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

/* Subscription Modal Styles */
.modal.show {
  display: block !important;
}

.modal-backdrop {
  display: none;
}

.modal-dialog {
  max-width: 800px;
}

.table-sm td, .table-sm th {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.table-success {
  background-color: rgba(25, 135, 84, 0.1);
}

.table-danger {
  background-color: rgba(220, 53, 69, 0.1);
}

.badge {
  font-size: 0.75em;
  padding: 0.35em 0.65em;
}

.badge.small {
  font-size: 0.65em;
  padding: 0.25em 0.5em;
}

.gap-1 {
  gap: 0.25rem;
}
</style> 