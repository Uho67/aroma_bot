<template>
  <div class="coupon-code-manager">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">
        <i class="fas fa-ticket-alt text-primary me-2"></i>
        Управление купонами
      </h2>
    </div>

    <!-- Search Bar -->
    <div class="card shadow-sm mb-3 search-bar">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
              <input 
                type="text" 
                class="form-control" 
                v-model="searchQuery" 
                placeholder="Поиск по коду купона..."
                @input="filterCoupons"
              >
              <button 
                v-if="searchQuery" 
                class="btn btn-outline-secondary" 
                @click="clearSearch"
                title="Очистить поиск"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="col-md-6 text-end">
            <span class="text-muted">
              Найдено: {{ filteredCouponCodes.length }} из {{ couponCodes.length }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Coupon Codes List -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>ID</th>
                <th>Код</th>
                <th>Пользователь</th>
                <th>Правило продаж</th>
                <th>Использовано</th>
                <th>Макс. использований</th>
                <th>Дата использования</th>
                <th>Статус отправки</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredCouponCodes.length === 0">
                <td colspan="10" class="text-center py-4">
                  <div class="text-muted">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p class="mb-0">
                      {{ searchQuery ? 'По вашему запросу ничего не найдено' : 'Купоны не найдены' }}
                    </p>
                    <small v-if="searchQuery">Попробуйте изменить поисковый запрос</small>
                  </div>
                </td>
              </tr>
              <tr v-for="coupon in filteredCouponCodes" :key="coupon.id">
                <td>{{ coupon.id }}</td>
                <td>
                  <span class="badge bg-primary fs-6">{{ coupon.code }}</span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-medium text-primary">
                      <i class="fas fa-user me-1"></i>
                      Пользователь
                    </span>
                    <small class="text-muted">{{ coupon.chat_id }}</small>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-medium">{{ coupon.sales_rule.name }}</span>
                    <small class="text-muted">{{ coupon.sales_rule.description || 'Без описания' }}</small>
                  </div>
                </td>
                <td>
                  <span class="badge" :class="getUsageBadgeClass(coupon.uses_count, coupon.max_uses)">
                    {{ coupon.uses_count }} / {{ coupon.max_uses }}
                  </span>
                </td>
                <td>{{ coupon.max_uses }}</td>
                <td>
                  <span v-if="coupon.used_at" class="text-success">
                    {{ formatDate(coupon.used_at) }}
                  </span>
                  <span v-else class="text-muted">Не использован</span>
                </td>
                <td>
                  <span class="badge" :class="coupon.is_sent ? 'bg-success' : 'bg-warning'">
                    {{ coupon.is_sent ? 'Отправлен' : 'Не отправлен' }}
                  </span>
                </td>
                <td>{{ formatDate(coupon.createdAt) }}</td>
                <td>
                  <div class="btn-group" role="group">
                    <button 
                      v-if="!coupon.is_sent"
                      class="btn btn-sm btn-outline-success" 
                      @click="markAsSent(coupon.id)"
                      title="Отметить как отправленный"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button 
                      v-if="coupon.uses_count < coupon.max_uses"
                      class="btn btn-sm btn-outline-info" 
                      @click="markAsUsed(coupon.id)"
                      title="Отметить как использованный"
                    >
                      <i class="fas fa-flag-checkered"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteCoupon(coupon.id)">
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

    <!-- Statistics Card -->
    <div class="row mt-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">Всего купонов</h6>
                <h3 class="mb-0">{{ couponCodes.length }}</h3>
              </div>
              <i class="fas fa-ticket-alt fa-2x opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">Отправлено</h6>
                <h3 class="mb-0">{{ sentCouponsCount }}</h3>
              </div>
              <i class="fas fa-paper-plane fa-2x opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">Использовано</h6>
                <h3 class="mb-0">{{ usedCouponsCount }}</h3>
              </div>
              <i class="fas fa-flag-checkered fa-2x opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="card-title">Активных</h6>
                <h3 class="mb-0">{{ activeCouponsCount }}</h3>
              </div>
              <i class="fas fa-clock fa-2x opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CouponCodeManager',
  data() {
    return {
      couponCodes: [],
      searchQuery: ''
    };
  },
  computed: {
    filteredCouponCodes() {
      if (!this.searchQuery.trim()) {
        return this.couponCodes;
      }
      
      const query = this.searchQuery.toLowerCase().trim();
      return this.couponCodes.filter(coupon => 
        coupon.code.toLowerCase().includes(query)
      );
    },
    sentCouponsCount() {
      return this.couponCodes.filter(coupon => coupon.is_sent).length;
    },
    usedCouponsCount() {
      return this.couponCodes.filter(coupon => coupon.uses_count > 0).length;
    },
    activeCouponsCount() {
      return this.couponCodes.filter(coupon => 
        coupon.is_sent && coupon.uses_count < coupon.max_uses
      ).length;
    }
  },
  async mounted() {
    await this.loadCouponCodes();
  },
  methods: {
    async loadCouponCodes() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        const response = await fetch(`${API_URL}/api/coupon-codes`);
        this.couponCodes = await response.json();
      } catch (error) {
        console.error('Error loading coupon codes:', error);
      }
    },
    async markAsSent(id) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        const response = await fetch(`${API_URL}/api/coupon-codes/${id}/sent`, {
          method: 'PUT'
        });
        if (response.ok) {
          await this.loadCouponCodes();
        }
      } catch (error) {
        console.error('Error marking coupon as sent:', error);
      }
    },
    async markAsUsed(id) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
        const response = await fetch(`${API_URL}/api/coupon-codes/${id}/used`, {
          method: 'PUT'
        });
        if (response.ok) {
          await this.loadCouponCodes();
        }
      } catch (error) {
        console.error('Error marking coupon as used:', error);
      }
    },
    async deleteCoupon(id) {
      if (confirm('Вы уверены, что хотите удалить этот купон?')) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
          const response = await fetch(`${API_URL}/api/coupon-codes/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            await this.loadCouponCodes();
          }
        } catch (error) {
          console.error('Error deleting coupon:', error);
        }
      }
    },
    getUsageBadgeClass(uses, maxUses) {
      if (uses === 0) return 'bg-secondary';
      if (uses >= maxUses) return 'bg-danger';
      if (uses >= maxUses * 0.8) return 'bg-warning';
      return 'bg-success';
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('ru-RU');
    },
    filterCoupons() {
      // This method is called automatically when searchQuery changes
      // The filtering is handled by the computed property
    },
    clearSearch() {
      this.searchQuery = '';
    }
  }
};
</script>

<style scoped>
.coupon-code-manager {
  padding: 20px;
}

.badge {
  font-size: 0.875rem;
}

.table th {
  font-weight: 600;
}

.search-bar {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
}

.search-bar .input-group-text {
  background-color: #fff;
  border-right: none;
}

.search-bar .form-control {
  border-left: none;
}

.search-bar .form-control:focus {
  box-shadow: none;
  border-color: #dee2e6;
}

.table td {
  vertical-align: middle;
}

.btn-group .btn {
  margin-right: 2px;
}

.btn-group .btn:last-child {
  margin-right: 0;
}
</style> 