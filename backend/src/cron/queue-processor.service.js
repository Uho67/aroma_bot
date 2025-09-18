const { PrismaClient } = require('@prisma/client');
const SalesRuleService = require('../sales-rule/sales-rule.service');

const prisma = new PrismaClient();
const salesRuleService = new SalesRuleService();

class QueueProcessorService {
  constructor() {
    this.isRunning = false;
  }

  async processQueue() {
    if (this.isRunning) {
      console.log('Queue processor already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting queue processing...');

    try {
      // Получаем 100 записей из очереди
      const queueItems = await prisma.userSalesRuleQueue.findMany({
        take: 300,
        orderBy: { createdAt: 'asc' } // Обрабатываем по порядку (FIFO)
      });

      console.log(`Found ${queueItems.length} items in queue to process`);

      if (queueItems.length === 0) {
        console.log('Queue is empty, nothing to process');
        return;
      }

      // Группируем записи по sales_rule_id для массовой обработки
      const groupedBySalesRule = {};
      queueItems.forEach(item => {
        if (!groupedBySalesRule[item.sales_rule_id]) {
          groupedBySalesRule[item.sales_rule_id] = [];
        }
        groupedBySalesRule[item.sales_rule_id].push(item.user_id);
      });

      console.log(`Grouped into ${Object.keys(groupedBySalesRule).length} sales rules`);

      let processedCount = 0;
      const errors = [];

      // Обрабатываем каждую группу sales rules
      for (const [salesRuleId, userIds] of Object.entries(groupedBySalesRule)) {
        try {
          console.log(`Processing sales rule ${salesRuleId} for ${userIds.length} users`);

          // Получаем chat_ids для пользователей
          const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { chat_id: true }
          });

          const chatIds = users.map(user => user.chat_id);

          if (chatIds.length > 0) {
            // Отправляем купоны используя существующий метод sendToUsers
            const couponCodes = await salesRuleService.sendToUsers(parseInt(salesRuleId), chatIds);
            console.log(`Successfully sent ${couponCodes.length} coupons for sales rule ${salesRuleId}`);

            // Удаляем обработанные записи из очереди
            await prisma.userSalesRuleQueue.deleteMany({
              where: {
                AND: [
                  { sales_rule_id: parseInt(salesRuleId) },
                  { user_id: { in: userIds } }
                ]
              }
            });

            processedCount += userIds.length;
            console.log(`Removed ${userIds.length} processed items from queue for sales rule ${salesRuleId}`);
          }
        } catch (error) {
          console.error(`Error processing sales rule ${salesRuleId}:`, error);
          errors.push({
            salesRuleId: parseInt(salesRuleId),
            userIds: userIds,
            error: error.message
          });
        }
      }

      console.log(`Queue processing completed. Processed: ${processedCount}, Errors: ${errors.length}`);
      
      if (errors.length > 0) {
        console.error('Errors during processing:', errors);
      }

    } catch (error) {
      console.error('Error during queue processing:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Метод для ручного запуска (для тестирования)
  async manualProcess() {
    console.log('Manual queue processing requested...');
    await this.processQueue();
  }

  // Метод для добавления пользователя в очередь
  async addToQueue(userId, salesRuleId) {
    try {
      const queueItem = await prisma.userSalesRuleQueue.create({
        data: {
          user_id: userId,
          sales_rule_id: salesRuleId
        }
      });
      console.log(`Added user ${userId} to queue for sales rule ${salesRuleId}`);
      return queueItem;
    } catch (error) {
      console.error(`Error adding user ${userId} to queue:`, error);
      throw error;
    }
  }

  // Метод для получения статистики очереди
  async getQueueStats() {
    try {
      const totalItems = await prisma.userSalesRuleQueue.count();
      const oldestItem = await prisma.userSalesRuleQueue.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      const newestItem = await prisma.userSalesRuleQueue.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      return {
        totalItems,
        oldestItem: oldestItem?.createdAt,
        newestItem: newestItem?.createdAt
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw error;
    }
  }
}

module.exports = QueueProcessorService;
