<template>
  <div class="cron-manager">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Управление Cron задачами</h2>
      <div class="d-flex gap-2 align-items-center">
        <button @click="refreshStats" class="btn btn-outline-primary" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Обновить статистику
        </button>
      </div>
    </div>

    <!-- Статистика очереди -->
    <div class="row mb-4" v-if="queueStats">
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Записей в очереди</h5>
            <h3 class="text-primary">{{ queueStats.totalItems || 0 }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Самая старая запись</h5>
            <h6 class="text-warning">{{ formatDate(queueStats.oldestItem) || 'Нет данных' }}</h6>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Самая новая запись</h5>
            <h6 class="text-success">{{ formatDate(queueStats.newestItem) || 'Нет данных' }}</h6>
          </div>
        </div>
      </div>
    </div>

    <!-- Управление Cron задачами -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Ручное управление Cron задачами</h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <!-- Обработка очереди купонов -->
              <div class="col-md-6">
                <div class="card border-primary">
                  <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">
                      <i class="fas fa-tags me-2"></i>
                      Очередь купонов
                    </h6>
                  </div>
                  <div class="card-body">
                    <p class="card-text">
                      <strong>Что делает:</strong> Обрабатывает очередь пользователей, ожидающих получения купонов.
                      <br><strong>Автоматически:</strong> Каждые 5 минут
                      <br><strong>Обрабатывает:</strong> До 100 записей за раз
                    </p>
                    <div class="d-flex gap-2">
                      <button 
                        @click="runQueueProcess" 
                        class="btn btn-primary" 
                        :disabled="queueProcessing">
                        <span v-if="queueProcessing" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="fas fa-play me-2"></i>
                        {{ queueProcessing ? 'Обрабатываю...' : 'Обработать очередь купонов' }}
                      </button>
                      <button 
                        @click="getQueueStats" 
                        class="btn btn-outline-secondary">
                        <i class="fas fa-chart-bar me-2"></i>
                        Статистика
                      </button>
                    </div>
                    <div v-if="queueProcessResult" class="mt-3">
                      <div class="alert alert-success">
                        <h6>Результат обработки:</h6>
                        <p class="mb-1"><strong>Обработано записей:</strong> {{ queueProcessResult.processedCount || 0 }}</p>
                        <p class="mb-1"><strong>Ошибок:</strong> {{ queueProcessResult.errors?.length || 0 }}</p>
                        <p class="mb-0"><strong>Время выполнения:</strong> {{ queueProcessResult.executionTime }}ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Проверка пользователей требующих внимания -->
              <div class="col-md-6">
                <div class="card border-warning">
                  <div class="card-header bg-warning text-dark">
                    <h6 class="mb-0">
                      <i class="fas fa-exclamation-triangle me-2"></i>
                      Проверка неактивных пользователей
                    </h6>
                  </div>
                  <div class="card-body">
                    <p class="card-text">
                      <strong>Что делает:</strong> Находит пользователей, которые не были активны более 14 дней.
                      <br><strong>Автоматически:</strong> Каждый день в 9:00
                      <br><strong>Устанавливает:</strong> attention_needed = true для неактивных
                    </p>
                    <div class="d-flex gap-2">
                      <button 
                        @click="runAttentionCheck" 
                        class="btn btn-warning" 
                        :disabled="attentionChecking">
                        <span v-if="attentionChecking" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="fas fa-search me-2"></i>
                        {{ attentionChecking ? 'Проверяю...' : 'Проверить неактивных пользователей' }}
                      </button>
                    </div>
                    <div v-if="attentionCheckResult" class="mt-3">
                      <div class="alert alert-info">
                        <h6>Результат проверки:</h6>
                        <p class="mb-0">{{ attentionCheckResult.message }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Логи выполнения -->
            <div class="mt-4" v-if="executionLogs.length > 0">
              <h6>Логи выполнения:</h6>
              <div class="execution-logs">
                <div 
                  v-for="(log, index) in executionLogs" 
                  :key="index"
                  class="log-item"
                  :class="log.type">
                  <small class="text-muted">{{ formatTime(log.timestamp) }}</small>
                  <span class="ms-2">{{ log.message }}</span>
                </div>
              </div>
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
  name: 'CronManager',
  data() {
    return {
      loading: false,
      queueProcessing: false,
      attentionChecking: false,
      queueStats: null,
      queueProcessResult: null,
      attentionCheckResult: null,
      executionLogs: []
    };
  },
  async created() {
    await this.getQueueStats();
  },
  methods: {
    async getQueueStats() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_URL}/api/cron/queue-stats`);
        if (response.data.success) {
          this.queueStats = response.data.stats;
          this.addLog('info', 'Статистика очереди обновлена');
        }
      } catch (error) {
        console.error('Error getting queue stats:', error);
        this.addLog('error', 'Ошибка получения статистики очереди');
      } finally {
        this.loading = false;
      }
    },

    async runQueueProcess() {
      this.queueProcessing = true;
      this.queueProcessResult = null;
      const startTime = Date.now();

      try {
        const response = await axios.post(`${API_URL}/api/cron/queue-process`);
        if (response.data.success) {
          this.queueProcessResult = {
            processedCount: 0,
            errors: [],
            executionTime: Date.now() - startTime
          };
          this.addLog('success', 'Обработка очереди купонов завершена успешно');
          await this.getQueueStats();
        }
      } catch (error) {
        console.error('Error running queue process:', error);
        this.addLog('error', 'Ошибка при обработке очереди купонов: ' + error.message);
      } finally {
        this.queueProcessing = false;
      }
    },

    async runAttentionCheck() {
      this.attentionChecking = true;
      this.attentionCheckResult = null;

      try {
        const response = await axios.post(`${API_URL}/api/cron/attention-check`);
        if (response.data.success) {
          this.attentionCheckResult = {
            message: response.data.message
          };
          this.addLog('success', 'Проверка неактивных пользователей завершена успешно');
        }
      } catch (error) {
        console.error('Error running attention check:', error);
        this.addLog('error', 'Ошибка при проверке неактивных пользователей: ' + error.message);
      } finally {
        this.attentionChecking = false;
      }
    },

    async refreshStats() {
      await this.getQueueStats();
    },

    addLog(type, message) {
      this.executionLogs.unshift({
        type: `log-${type}`,
        message,
        timestamp: new Date()
      });

      if (this.executionLogs.length > 50) {
        this.executionLogs = this.executionLogs.slice(0, 50);
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('ru-RU');
    },

    formatTime(date) {
      if (!date) return '';
      return date.toLocaleTimeString('ru-RU');
    }
  }
};
</script>

<style scoped>
.cron-manager {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header h6 {
  font-size: 0.9rem;
  font-weight: 600;
}

.execution-logs {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  background-color: #f8f9fa;
}

.log-item {
  padding: 0.25rem 0;
  border-bottom: 1px solid #e9ecef;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.log-success {
  color: #198754;
}

.log-item.log-error {
  color: #dc3545;
}

.log-item.log-info {
  color: #0dcaf0;
}

.log-item.log-warning {
  color: #ffc107;
}

code {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.card-text strong {
  color: #495057;
}
</style>
