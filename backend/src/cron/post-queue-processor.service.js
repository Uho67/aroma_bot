const { PrismaClient } = require('@prisma/client');
const BroadcastService = require('../broadcast/broadcast.service');
const { bot } = require('../telegram/bot.service');
const AttentionCheckerService = require('./attention-checker.service');

const prisma = new PrismaClient();
const broadcastService = new BroadcastService();
const attentionChecker = new AttentionCheckerService();

class PostQueueProcessorService {
  constructor() {
    this.isRunning = false;
  }

  async processPostQueue() {
    if (this.isRunning) {
      console.log('Post queue processor already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting post queue processing...');

    try {
      // Получаем 100 записей из очереди постов (без include)
      const queueItems = await prisma.postQueue.findMany({
        take: 100,
        orderBy: { createdAt: 'asc' }
      });

      console.log(` Found ${queueItems.length} items in post queue`);

      if (queueItems.length === 0) {
        console.log('✅ No posts in queue to process');
        return;
      }

      // Показываем детали каждой записи
      queueItems.forEach((item, index) => {
        console.log(` Queue item ${index + 1}: Post ID: ${item.post_id}, User ID: ${item.user_id}, Created: ${item.createdAt}`);
      });

      let processedCount = 0;
      const errors = [];

      // Группируем по post_id для отправки
      const postsByUser = {};
      queueItems.forEach(item => {
        if (!postsByUser[item.post_id]) {
          postsByUser[item.post_id] = [];
        }
        postsByUser[item.post_id].push(item.user_id);
      });

      console.log(`📋 Grouped posts:`, postsByUser);

      // Обрабатываем посты группами
      for (const [postId, userIds] of Object.entries(postsByUser)) {
        try {
          console.log(` Processing post ${postId} for ${userIds.length} users`);

          // Получаем пост
          const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
          });

          if (!post) {
            console.log(`❌ Post ${postId} not found, skipping...`);
            continue;
          }

          console.log(` Post found:`, { id: post.id, description: post.description?.substring(0, 50) + '...' });

          // Получаем chat_id для каждого user_id
          const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { chat_id: true }
          });

          const chatIds = users.map(user => user.chat_id);
          console.log(` Chat IDs for users:`, chatIds);

          // Отправляем пост пользователям используя существующий метод из broadcastService
          console.log(` Attempting to send post ${postId} to users:`, chatIds);

          // Передаем bot напрямую
          const sendResults = await broadcastService.sendPostToUsers(post, chatIds, broadcastService.buttonsService, bot);

          console.log(` Sent post ${postId} to ${sendResults.sentCount} users`);
          console.log(`📊 Send results:`, sendResults);

          if (sendResults.errors.length > 0) {
            console.log(`⚠️ Errors sending post ${postId}:`, sendResults.errors);
          }

          // Reset attention_needed for users who successfully received the post
          if (sendResults.sentCount > 0) {
            try {
              const successfulChatIds = sendResults.results
                .filter(r => r.success)
                .map(r => r.chatId);

              if (successfulChatIds.length > 0) {
                await attentionChecker.resetUserAttentionByChatIds(successfulChatIds);
                console.log(`✅ Reset attention_needed for ${successfulChatIds.length} users after sending post ${postId}`);
              }
            } catch (resetError) {
              console.error('❌ Error resetting attention_needed after post sending:', resetError);
              // Don't block the main process due to attention reset error
            }
          }

          // Удаляем обработанные записи из очереди
          const deletedCount = await prisma.postQueue.deleteMany({
            where: {
              AND: [
                { post_id: parseInt(postId) },
                { user_id: { in: userIds } }
              ]
            }
          });

          console.log(`️ Deleted ${deletedCount.count} processed items from queue for post ${postId}`);

          processedCount += sendResults.sentCount;
          errors.push(...sendResults.errors);

        } catch (error) {
          console.error(`❌ Error processing post ${postId}:`, error);
          console.error(`❌ Error stack:`, error.stack);
          errors.push({ postId, error: error.message });
        }
      }

      console.log(`🎉 Post queue processing completed. Processed ${processedCount} items`);

      if (errors.length > 0) {
        console.log('⚠️ Errors encountered:', errors);
      }

    } catch (error) {
      console.error('💥 Error in post queue processing:', error);
      console.error('💥 Error stack:', error.stack);
    } finally {
      this.isRunning = false;
      console.log('🏁 Post queue processor finished');
    }
  }

  // Метод для получения статистики очереди
  async getQueueStats() {
    try {
      const totalItems = await prisma.postQueue.count();
      const oldestItem = await prisma.postQueue.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      const newestItem = await prisma.postQueue.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      return {
        totalItems,
        oldestItem: oldestItem?.createdAt || null,
        newestItem: newestItem?.createdAt || null
      };
    } catch (error) {
      console.error('Error getting post queue stats:', error);
      return null;
    }
  }
}

module.exports = PostQueueProcessorService;
