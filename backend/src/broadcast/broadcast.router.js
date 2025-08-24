const express = require('express');
const path = require('path');
const fs = require('fs');
const BroadcastService = require('./broadcast.service');
const ButtonsService = require('../telegram/buttons.services');
const { attentionChecker } = require('../cron');

class BroadcastRouter {
  constructor(botService) {
    this.router = express.Router();
    this.broadcastService = new BroadcastService();
    this.buttonsService = new ButtonsService();
    this.botService = botService;
    this.setupRoutes();
  }

  setupRoutes() {
    // Custom broadcast to specific users (теперь добавляет в очередь постов)
    this.router.post('/broadcast/custom', async (req, res) => {
      try {
        const { postId, userIds } = req.body;

        if (!postId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ error: 'Invalid request data' });
        }

        // Проверяем что postId это валидное число
        if (isNaN(parseInt(postId))) {
          return res.status(400).json({
            error: 'Invalid post ID format',
            receivedPostId: postId,
            postIdType: typeof postId
          });
        }

        // Получаем пост
        const post = await this.broadcastService.getPostById(postId);
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }

        // Вместо отправки постов сразу, добавляем в очередь постов
        const result = await this.broadcastService.addPostToQueue(postId, userIds);

        if (result.success) {
          res.json({
            success: true,
            message: `Post added to queue for ${result.addedCount} users`,
            addedCount: result.addedCount
          });
        } else {
          res.status(500).json({ error: 'Failed to add post to queue' });
        }

      } catch (error) {
        console.error('Error adding post to queue:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Broadcast post to all users
    this.router.post('/broadcast/:postId', async (req, res) => {
      try {
        const { postId } = req.params;

        // Get the post
        const post = await this.broadcastService.getPostById(parseInt(postId));
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }

        // Get all non-blocked users
        const users = await this.broadcastService.getNonBlockedUsers();

        if (users.length === 0) {
          return res.json({
            message: 'No active users to broadcast to',
            sentCount: 0,
            totalUsers: 0
          });
        }

        // Get bot instance
        const bot = this.botService.getBot();
        if (!bot) {
          return res.status(500).json({ error: 'Bot is not initialized' });
        }

        // Send post to all users using encapsulated method
        const sendResult = await this.broadcastService.sendPostToUsers(post, users.map(u => u.chat_id), this.buttonsService, bot);
        const { sentCount, errors, results } = sendResult;

        // After successful post sending to all users, reset attention_needed
        if (sentCount > 0) {
          try {
            const successfulChatIds = results
              .filter(r => r.success)
              .map(r => r.chatId);

            await attentionChecker.resetUserAttentionByChatIds(successfulChatIds);
            console.log(`Reset attention_needed for ${successfulChatIds.length} users after mass broadcast`);
          } catch (resetError) {
            console.error('Error resetting attention_needed after mass broadcast:', resetError);
            // Не блокируем основной ответ из-за ошибки сброса attention_needed
          }
        }

        res.json({
          success: true,
          message: `Post sent to ${sentCount} users`,
          sentCount,
          errors
        });

      } catch (error) {
        console.error('Error broadcasting post:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = BroadcastRouter; 