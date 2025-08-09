require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const ButtonsService = require('./buttons.services');
const UserService = require('../user/user.service');

class BotService {
  constructor() {
    this.bot = null;
    this.prisma = new PrismaClient();
    this.buttonsService = new ButtonsService();
    this.userService = new UserService();
  }

  async initializeBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      await this.setupBotHandlers();
      console.log('Bot initialized successfully');
    } catch (error) {
      console.error('Error initializing bot:', error);
      this.bot = null;
    }
  }

  async setupBotHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const userData = {
          chat_id: chatId.toString(),
          user_name: msg.from.username || null,
          first_name: msg.from.first_name || null,
          last_name: msg.from.last_name || null,
          is_blocked: false
        };

        // Check if user already exists
        const existingUser = await this.userService.getUserByChatId(chatId.toString());
        
        if (!existingUser) {
          // Create new user if they don't exist
          await this.userService.createUser(userData);
          console.log(`New user registered: ${userData.first_name} (${chatId})`);
        } else {
          // Update existing user information
          await this.userService.updateUser(chatId.toString(), userData);
          console.log(`Existing user updated: ${userData.first_name} (${chatId})`);
        }
      } catch (error) {
        console.error('Error storing/updating user data:', error);
        // Continue with bot functionality even if user storage fails
      }

      await this.sendStartMessage(this.bot, chatId);
    });

    // Handle callback queries (button clicks)
    this.bot.on('callback_query', async (callbackQuery) => {
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;

      if (data === 'welcome') {
        this.sendStartMessage(this.bot, chatId);
      }

      if (data === 'catalog') {
        try {
          // Answer the callback query to remove the loading state
          await this.bot.answerCallbackQuery(callbackQuery.id);
          // Send catalog buttons
          const keyboard = await this.buttonsService.getCatalogMenuButtons();
          await this.bot.sendMessage(chatId, 'Оберiть категорiю :', {
            reply_markup: keyboard
          });
        } catch (error) {
          console.error('Error sending catalog:', error);
          this.bot.sendMessage(chatId, 'Произошла ошибка при загрузке каталога.');
        }
      }

      if (data.includes('_menu')) {
        const post = await this.prisma.post.findFirst({
          where: {
            link_to_button: data
          }
        });

        if (post) {
          const imagePath = path.join(__dirname, '..', post.image);
          if (fs.existsSync(imagePath)) {
            await this.bot.sendPhoto(chatId, imagePath, {
              caption: post.description,
              reply_markup: await this.buttonsService.getButtonsForOrder()
            });
          } 
        } else {
          await this.bot.sendMessage(chatId, 'Категория не найдена' , {
            reply_markup: await this.buttonsService.getCatalogMenuButtons()
          });
        }
      } else if (data.startsWith('message_')) {
        // Handle message buttons - extract message text from button value
        const messageText = data.replace('message_', '');
        
        if (messageText) {
          await this.bot.sendMessage(chatId, messageText);
        } else {
          await this.bot.sendMessage(chatId, 'Сообщение не найдено.');
        }
      }
    });

    // Handle user blocking/unblocking the bot
    this.bot.on('my_chat_member', async (chatMember) => {
      const chatId = chatMember.chat.id;
      const newStatus = chatMember.new_chat_member.status;
      const oldStatus = chatMember.old_chat_member.status;

      try {
        // Check if user exists in database
        const existingUser = await this.userService.getUserByChatId(chatId.toString());
        
        if (existingUser) {
          // Update user's blocked status based on new status
          const isBlocked = newStatus === 'kicked' || newStatus === 'left';
          
          await this.userService.updateUserBlockStatus(chatId.toString(), isBlocked);
          
          if (isBlocked) {
            console.log(`User ${existingUser.first_name} (${chatId}) blocked the bot`);
          } else {
            console.log(`User ${existingUser.first_name} (${chatId}) unblocked the bot`);
          }
        }
      } catch (error) {
        console.error('Error handling chat member update:', error);
      }
    });

    // Handle general messages
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;

      // Get keyboard layout using ButtonsService
      const keyboard = await this.buttonsService.getWelcomeMenuButtons();
    });
  }

  async sendStartMessage(bot, chatId) {
    const keyboard = await this.buttonsService.getWelcomeMenuButtons();

    // Get start message settings
    let startMessage = await this.prisma.startMessageSettings.findFirst({
      where: { id: 1 }
    });

    if (!startMessage) {
      return;
    }

    const imagePath = path.join(__dirname, '..', startMessage.image);
    if (fs.existsSync(imagePath)) {
      await bot.sendPhoto(chatId, imagePath, {
        caption: startMessage.text,
        reply_markup: keyboard
      });
    }
  }

  /**
   * Get bot instance
   * @returns {TelegramBot|null} Bot instance
   */
  getBot() {
    return this.bot;
  }
}

module.exports = BotService; 