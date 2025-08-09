const express = require('express');
const path = require('path');
const fs = require('fs');
const BroadcastService = require('./broadcast.service');
const ButtonsService = require('../telegram/buttons.services');

class BroadcastRouter {
  constructor(botService) {
    this.router = express.Router();
    this.broadcastService = new BroadcastService();
    this.buttonsService = new ButtonsService();
    this.botService = botService;
    this.setupRoutes();
  }

  setupRoutes() {
    // Broadcast post to all users
    this.router.post('/broadcast/:postId', async (req, res) => {
      try {
        const { postId } = req.params;
        
        // Get the post
        const post = await this.broadcastService.getPostById(postId);
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

        let sentCount = 0;
        const errors = [];

        // Send post to each user
        for (const user of users) {
          try {
            const imagePath = path.join(__dirname, '..', post.image);
            const keyboard = await this.buttonsService.getWelcomeMenuButtons();
            if (fs.existsSync(imagePath)) {
              await bot.sendPhoto(user.chat_id, imagePath, {
                caption: post.description,
                reply_markup: keyboard
              });
            } else {
              // Send text message if image doesn't exist
              await bot.sendMessage(user.chat_id, post.description);
            }
            sentCount++;
          } catch (error) {
            console.error(`Error sending to user ${user.chat_id}:`, error);
            errors.push({
              userId: user.chat_id,
              error: error.message
            });
          }
        }

        res.json({
          message: `Post broadcasted successfully`,
          sentCount: sentCount,
          totalUsers: users.length,
          errors: errors
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