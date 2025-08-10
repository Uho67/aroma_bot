require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { PrismaClient } = require('@prisma/client');

class AdminBotService {
	constructor() {
		this.bot = null;
		this.prisma = new PrismaClient();
	}

	static getInstance() {
		if (!AdminBotService.instance) {
			AdminBotService.instance = new AdminBotService();
		}
		return AdminBotService.instance;
	}

	async initializeBot() {
		const token = process.env.ADMIN_BOT_TOKEN;
		if (!token) {
			console.error('ADMIN_BOT_TOKEN is not set in environment variables');
			return;
		}

		try {
			this.bot = new TelegramBot(token, { polling: true });
			await this.setupBotHandlers();
			console.log('Admin Bot initialized successfully');
		} catch (error) {
			console.error('Error initializing admin bot:', error);
			this.bot = null;
		}
	}

	async setupBotHandlers() {
		// Handle text messages (coupon code queries)
		this.bot.on('message', async (msg) => {
			if (msg.text && !msg.text.startsWith('/')) {
				await this.handleCouponCodeQuery(msg);
			}
		});

		// Handle callback queries (button clicks)
		this.bot.on('callback_query', async (callbackQuery) => {
			await this.handleCallbackQuery(callbackQuery);
		});
	}

	async handleCouponCodeQuery(msg) {
		const chatId = msg.chat.id;
		const code = msg.text.trim().toUpperCase();

		try {
			// Find coupon code
			const couponCode = await this.prisma.couponCode.findUnique({
				where: { code: code },
				include: {
					sales_rule: true
				}
			});

			if (!couponCode) {
				await this.bot.sendMessage(chatId, `❌ Купон с кодом "${code}" не найден.`);
				return;
			}

			// Get user info from chat_id
			const user = await this.prisma.user.findUnique({
				where: { chat_id: couponCode.chat_id }
			});

			const userInfo = user ?
				`${user.first_name || user.user_name || 'Неизвестно'} (${couponCode.chat_id})` :
				`Пользователь (${couponCode.chat_id})`;

			// Create message with coupon info
			const message = `🔍 **Информация о купоне**\n\n` +
				`📋 **Код:**\n\`${couponCode.code}\`\n` +
				`📊 **Максимум использований:** ${couponCode.max_uses}\n` +
				`✅ **Использовано раз:** ${couponCode.uses_count}\n` +
				`👤 **Пользователь:** ${userInfo}\n` +
				`🎯 **Акция:** ${couponCode.sales_rule.name}\n` +
				`📝 **Описание:** ${couponCode.sales_rule.description || 'Нет описания'}`;

			// Create inline keyboard with "Use Coupon" button
			const keyboard = {
				inline_keyboard: [[
					{
						text: '🎫 Использовать купон',
						callback_data: `use_coupon:${couponCode.id}`
					}
				]]
			};

			await this.bot.sendMessage(chatId, message, {
				parse_mode: 'Markdown',
				reply_markup: keyboard
			});

		} catch (error) {
			console.error('Error handling coupon code query:', error);
			await this.bot.sendMessage(chatId, '❌ Произошла ошибка при поиске купона.');
		}
	}

	async handleCallbackQuery(callbackQuery) {
		const chatId = callbackQuery.message.chat.id;
		const data = callbackQuery.data;

		if (data.startsWith('use_coupon:')) {
			const couponId = parseInt(data.split(':')[1]);
			await this.useCoupon(chatId, couponId, callbackQuery.message);
		}

		// Answer callback query to remove loading state
		await this.bot.answerCallbackQuery(callbackQuery.id);
	}

	async useCoupon(chatId, couponId, originalMessage) {
		try {
			// Get coupon with current data
			const couponCode = await this.prisma.couponCode.findUnique({
				where: { id: couponId },
				include: {
					sales_rule: true
				}
			});

			if (!couponCode) {
				await this.bot.sendMessage(chatId, '❌ Купон не найден.');
				return;
			}

			// Check if coupon can be used
			if (couponCode.uses_count >= couponCode.max_uses) {
				await this.bot.sendMessage(chatId, '❌ Купон уже использован максимальное количество раз.');

				// Update the original message to show it's already used
				const usedKeyboard = {
					inline_keyboard: [[
						{
							text: '❌ Купон уже использован',
							callback_data: 'coupon_already_used'
						}
					]]
				};

				await this.bot.editMessageReplyMarkup(usedKeyboard, {
					chat_id: chatId,
					message_id: originalMessage.message_id
				});
				return;
			}

			// Update coupon usage
			const updatedCoupon = await this.prisma.couponCode.update({
				where: { id: couponId },
				data: {
					uses_count: couponCode.uses_count + 1,
					used_at: new Date()
				}
			});

			// Send success message
			const successMessage = `✅ **Купон использован!**\n\n` +
				`📋 **Код:**\n\`${couponCode.code}\`\n` +
				`📊 **Использовано:** ${updatedCoupon.uses_count}/${couponCode.max_uses}\n` +
				`⏰ **Время использования:** ${new Date().toLocaleString('ru-RU')}`;

			await this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });

			// Update the original message to show it's been used
			const updatedKeyboard = {
				inline_keyboard: [[
					{
						text: '✅ Купон использован',
						callback_data: 'coupon_used'
					}
				]]
			};

			await this.bot.editMessageReplyMarkup(updatedKeyboard, {
				chat_id: chatId,
				message_id: originalMessage.message_id
			});

		} catch (error) {
			console.error('Error using coupon:', error);
			await this.bot.sendMessage(chatId, '❌ Произошла ошибка при использовании купона.');
		}
	}

	getBot() {
		return this.bot;
	}

	async stopBot() {
		if (this.bot) {
			await this.bot.stopPolling();
			this.bot = null;
			console.log('Admin Bot stopped');
		}
	}
}

module.exports = AdminBotService; 