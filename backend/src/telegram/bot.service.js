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

  static getInstance() {
    if (!BotService.instance) {
      BotService.instance = new BotService();
    }
    return BotService.instance;
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

      // Check if user exists, if not - add them (for button clicks)
      try {
        const existingUser = await this.userService.getUserByChatId(chatId.toString());

        if (!existingUser) {
          // Create new user for any button interaction
          const userData = {
            chat_id: chatId.toString(),
            user_name: callbackQuery.from.username || null,
            first_name: callbackQuery.from.first_name || null,
            last_name: callbackQuery.from.last_name || null,
            is_blocked: false
          };

          await this.userService.createUser(userData);
          console.log(`New user registered via callback: ${userData.first_name} (${chatId})`);
        }
      } catch (error) {
        console.error('Error handling user in callback:', error);
        // Continue with bot functionality even if user storage fails
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
        return;
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
          await this.bot.sendMessage(chatId, 'Категория не найдена', {
            reply_markup: await this.buttonsService.getCatalogMenuButtons()
          });
        }
        return;
      } else if (data.startsWith('message_')) {
        // Handle message buttons - extract message text from button value
        const messageText = data.replace('message_', '');

        if (messageText) {
          await this.bot.sendMessage(chatId, messageText);
        } else {
          await this.bot.sendMessage(chatId, 'Сообщение не найдено.');
        }
        return;
      }
      this.sendStartMessage(this.bot, chatId);
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

      // Skip if it's a /start command (already handled above)
      if (msg.text && msg.text.startsWith('/start')) {
        return;
      }

      try {
        // Check if user exists, if not - add them
        const existingUser = await this.userService.getUserByChatId(chatId.toString());

        if (!existingUser) {
          // Create new user for any message interaction
          const userData = {
            chat_id: chatId.toString(),
            user_name: msg.from.username || null,
            first_name: msg.from.first_name || null,
            last_name: msg.from.last_name || null,
            is_blocked: false
          };

          await this.userService.createUser(userData);
          console.log(`New user registered via message: ${userData.first_name} (${chatId})`);
        }
      } catch (error) {
        console.error('Error handling user in message:', error);
        // Continue with bot functionality even if user storage fails
      }

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
   * Send coupon notification to user
   * @param {Object} couponCode - The coupon code object with sales_rule relation
   */
  async sendCouponNotification(couponCode) {
    try {
      if (!this.bot) {
        console.error('Bot not initialized');
        return;
      }

      const chatId = couponCode.chat_id;
      const salesRule = couponCode.sales_rule;
      const code = couponCode.code;

      // Get admin_path from configuration
      const configHelper = require('../configuration/config-helper');
      const adminPath = await configHelper.get('admin_path');

      if (!adminPath) {
        console.error('admin_path configuration not found');
        return;
      }

      // Create admin button with pre-filled message using admin_path config
      const adminButton = {
        text: '🎯 ОТРИМАТИ ЗНИЖКУ 🎯',
        url: `${adminPath}?text=${encodeURIComponent(`Доброго дня, бажаю зробити замовлення з SalesCode:\n${code}`)}`
      };

      // Create main menu button that sends /start command to bot
      const mainMenuButton = {
        text: '🏠 Головне меню',
        callback_data: 'start'
      };

      // Get sales buttons (render_type = 'sales') with coupon context
      const ButtonsService = require('./buttons.services');
      const buttonsService = new ButtonsService();
      const salesButtons = await buttonsService.getSalesButtons(code);

      // Create keyboard structure:
      // Row 1: "Получить скидку" button
      // Row 2: Sales buttons (if any)
      // Row 3: "Головне меню" button
      let keyboard = {
        inline_keyboard: [
          [adminButton]  // Row 1: Получить скидку
        ]
      };

      // Add sales buttons if they exist (Row 2)
      if (salesButtons.inline_keyboard && salesButtons.inline_keyboard.length > 0) {
        salesButtons.inline_keyboard.forEach(row => {
          keyboard.inline_keyboard.push(row);
        });
      }

      // Add main menu button (Row 3)
      keyboard.inline_keyboard.push([mainMenuButton]);

      // Send photo with caption and button
      if (salesRule.image) {
        const imagePath = path.join(__dirname, '..', salesRule.image);
        if (fs.existsSync(imagePath)) {
          await this.bot.sendPhoto(chatId, imagePath, {
            caption: salesRule.description || 'У вас есть новый купон на скидку!',
            reply_markup: keyboard
          });
        } else {
          // If image doesn't exist, send text message with button
          await this.bot.sendMessage(chatId, salesRule.description || 'У вас есть новый купон на скидку!', {
            reply_markup: keyboard
          });
        }
      } else {
        // If no image, send text message with button
        await this.bot.sendMessage(chatId, salesRule.description || 'У вас есть новый купон на скидку!', {
          reply_markup: keyboard
        });
      }

      console.log(`Coupon notification sent to user ${chatId} for code ${code}`);
    } catch (error) {
      console.error('Error sending coupon notification:', error);
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