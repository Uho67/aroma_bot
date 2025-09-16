const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const ButtonsService = require('../telegram/buttons.services');

class BroadcastService {
  constructor() {
    this.prisma = new PrismaClient();
    this.buttonsService = new ButtonsService();
  }

  /**
   * Get all non-blocked users
   * @returns {Promise<Array>} Array of non-blocked users
   */
  async getNonBlockedUsers() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          is_blocked: false
        }
      });
      return users;
    } catch (error) {
      console.error('Error getting non-blocked users:', error);
      throw error;
    }
  }

  /**
   * Get all attention_needed users
   * @returns {Promise<Array>} Array of attention_needed users
   */
  async getAttentionNeededUsers() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          is_blocked: false,
          attention_needed: true
        }
      });
      return users;
    } catch (error) {
      console.error('Error getting attention_needed users:', error);
      throw error;
    }
  }

  /**
   * Get post by ID
   * @param {number} postId - Post ID
   * @returns {Promise<Object|null>} Post object or null if not found
   */
  async getPostById(postId) {
    try {
      const numericPostId = parseInt(postId);
      if (isNaN(numericPostId)) {
        throw new Error('Invalid post ID: ' + postId);
      }

      const post = await this.prisma.post.findUnique({
        where: { id: numericPostId }
      });

      return post;
    } catch (error) {
      console.error('Error getting post by ID:', error);
      throw error;
    }
  }

  async sendPostToUser(post, chatId) {
    try {
      const bot = this.getBotService().bot;
      const imagePath = path.join(__dirname, '..', post.image);
      const keyboard = await this.buttonsService.getWelcomeMenuButtons();

      if (post.image && fs.existsSync(imagePath)) {
        await bot.sendPhoto(chatId, imagePath, {
          caption: post.description,
          reply_markup: keyboard
        });
      } else {
        // Send text message if no image or image doesn't exist
        await bot.sendMessage(chatId, post.description, {
          reply_markup: keyboard
        });
      }
      await this.prisma.user.update({
        where: { chat_id: chatId },
        data: { updatedAt: new Date() }
      });


      return { success: true, chatId };
    } catch (error) {
      console.error(`Error sending post to user ${chatId}:`, error);
      return { success: false, chatId, error: error.message };
    }
  }

  async sendPostToUsers(post, chatIds) {
    const results = [];
    let sentCount = 0;
    const errors = [];

    for (const chatId of chatIds) {
      const result = await this.sendPostToUser(post, chatId, this.buttonsService, this.getBotService().bot);
      results.push(result);

      if (result.success) {
        sentCount++;
      } else {
        errors.push({
          userId: result.chatId,
          error: result.error
        });
      }
    }

    return {
      sentCount,
      errors,
      results
    };
  }

  async addPostToQueue(postId, userIds) {
    let addedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const userId of userIds) {
      try {
        // Проверяем существование пользователя
        const user = await this.prisma.user.findUnique({
          where: { chat_id: userId.toString() }
        });

        if (!user || !user.id) {
          console.log(`User with chat_id ${userId} not found or has no ID, skipping...`);
          skippedCount++;
          continue;
        }

        const existingQueueItem = await this.prisma.postQueue.findFirst({
          where: {
            user_id: user.id,
            post_id: parseInt(postId)
          }
        });

        if (existingQueueItem) {
          console.log(`User ${userId} already in post queue for post ${postId}, skipping...`);
          skippedCount++;
          continue;
        }

        await this.prisma.postQueue.create({
          data: {
            user_id: user.id,
            post_id: parseInt(postId)
          }
        });

        addedCount++;
        console.log(`Successfully added user ${userId} to post queue`);

      } catch (error) {
        console.error(`Error adding user ${userId} to post queue:`, error);
        errors.push({ userId, error: error.message });
      }
    }

    return {
      success: true,
      addedCount,
      skippedCount,
      errors
    };
  }

  /**
   * Close Prisma connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }

  getBotService() {
    // Get the bot service from the global instance
    try {
      const BotService = require('../telegram/bot.service');
      return BotService.getInstance();
    } catch (error) {
      console.error('Failed to get bot service instance:', error);
      return null;
    }
  }
}

module.exports = BroadcastService; 