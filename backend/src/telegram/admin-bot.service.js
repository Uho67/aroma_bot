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

			if (!user) {
				await this.bot.sendMessage(chatId, `❌ Пользователь с chat_id "${couponCode.chat_id}" не найден.`);
				return;
			}

			// Check user subscription status using SubscriptionService
			// Note: SubscriptionService.checkSubscription already updates the database
			const subscriptionStatus = await this.checkUserSubscription(user);

			// Get channel info for display
			const SubscriptionService = require('./subscription.service');
			const subscriptionService = new SubscriptionService();
			await subscriptionService.initialize(this.bot);

			const subscriptionEmoji = subscriptionStatus ? '✅' : '❌';
			const subscriptionText = subscriptionStatus ? 'Подписан на канал' : 'НЕ подписан на канал';

			// Check if coupon is fully used
			const isFullyUsed = couponCode.uses_count >= couponCode.max_uses;
			const usageEmoji = isFullyUsed ? '❌' : '✅';
			const usageText = isFullyUsed ? 'Использовано раз (МАКСИМУМ)' : 'Использовано раз';

			// Create message with coupon info and subscription status
			let message = `🔍 **Информация о купоне**\n\n` +
				`📋 **Код:**\n\`${couponCode.code}\`\n` +
				`📊 **Максимум использований:** ${couponCode.max_uses}\n` +
				`${usageEmoji} **${usageText}:** ${couponCode.uses_count}\n` +
				`📺 **Подписка:** ${subscriptionEmoji} ${subscriptionText}\n` +
				`🎯 **Акция:** ${couponCode.sales_rule.name}\n` +
				`📝 **Описание:** ${couponCode.sales_rule.description || 'Нет описания'}`;

			// Add warning if coupon is fully used
			if (isFullyUsed) {
				message += `\n\n⚠️ **ВНИМАНИЕ:** Купон уже полностью использован!`;
			}

			// Create inline keyboard based on coupon usage status
			let keyboard;
			if (isFullyUsed) {
				// Coupon is fully used - show disabled button
				keyboard = {
					inline_keyboard: [[
						{
							text: '❌ Купон полностью использован',
							callback_data: 'coupon_fully_used'
						}
					]]
				};
			} else {
				// Coupon can still be used
				keyboard = {
					inline_keyboard: [[
						{
							text: '🎫 Использовать купон',
							callback_data: `use_coupon:${couponCode.id}`
						}
					]]
				};
			}

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
		} else if (data === 'coupon_fully_used') {
			// Handle fully used coupon button click
			await this.bot.answerCallbackQuery(callbackQuery.id, {
				text: '❌ Купон уже полностью использован!',
				show_alert: true
			});
			return;
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

	async checkUserSubscription(user) {
		try {
			// Use existing SubscriptionService instead of duplicating logic
			const SubscriptionService = require('./subscription.service');
			const subscriptionService = new SubscriptionService();

			// Initialize with admin bot
			await subscriptionService.initialize(this.bot);

			// Check subscription using chat_id (existing method)
			const result = await subscriptionService.checkSubscription(user.chat_id);

			return result.isSubscribed;
		} catch (error) {
			console.error('Error checking user subscription:', error);
			return false;
		}
	}

	async updateUserSubscriptionStatus(userId, isSubscribed) {
		try {
			// Update user's subscription status and updatedAt timestamp
			await this.prisma.user.update({
				where: { id: userId },
				data: {
					is_subscriber: isSubscribed,
					updatedAt: new Date()
				}
			});
			console.log(`Updated subscription status for user ${userId}: ${isSubscribed}`);
		} catch (error) {
			console.error('Error updating user subscription status:', error);
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