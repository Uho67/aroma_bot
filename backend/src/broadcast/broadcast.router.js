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

    // Broadcast post to all users (now adds to PostQueue for cron processing)
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
            addedCount: 0,
            totalUsers: 0
          });
        }

        // Add post to queue for all users
        const result = await this.broadcastService.addPostToQueue(parseInt(postId), users.map(u => u.chat_id));

        res.json({
          success: true,
          message: `Post added to queue for ${result.addedCount} users`,
          addedCount: result.addedCount,
          totalUsers: users.length,
          skippedCount: result.skippedCount
        });

      } catch (error) {
        console.error('Error adding post to queue:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Broadcast post to attention_needed users only (adds to PostQueue for cron processing)
    this.router.post('/broadcast/:postId/attention', async (req, res) => {
      try {
        const { postId } = req.params;

        // Get the post
        const post = await this.broadcastService.getPostById(parseInt(postId));
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }

        // Get attention_needed users
        const users = await this.broadcastService.getAttentionNeededUsers();

        if (users.length === 0) {
          return res.json({
            message: 'No users need attention',
            addedCount: 0,
            totalUsers: 0
          });
        }

        // Add post to queue for attention_needed users
        const result = await this.broadcastService.addPostToQueue(parseInt(postId), users.map(u => u.chat_id));

        res.json({
          success: true,
          message: `Post added to queue for ${result.addedCount} attention_needed users`,
          addedCount: result.addedCount,
          totalUsers: users.length,
          skippedCount: result.skippedCount
        });

      } catch (error) {
        console.error('Error adding post to attention_needed users queue:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = BroadcastRouter; 