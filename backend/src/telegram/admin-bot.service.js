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
		console.log('🚀 [ADMIN_BOT] Starting bot initialization...');

		const token = process.env.ADMIN_BOT_TOKEN;
		if (!token) {
			console.error('❌ [ADMIN_BOT] ADMIN_BOT_TOKEN is not set in environment variables');
			return;
		}

		console.log('🔑 [ADMIN_BOT] Token found, creating bot instance...');

		try {
			this.bot = new TelegramBot(token, { polling: true });
			console.log('🤖 [ADMIN_BOT] Bot instance created, setting up handlers...');

			await this.setupBotHandlers();
			console.log('✅ [ADMIN_BOT] Admin Bot initialized successfully');
		} catch (error) {
			console.error('❌ [ADMIN_BOT] Error initializing admin bot:', {
				error: error.message,
				stack: error.stack
			});
			this.bot = null;
		}
	}

	async setupBotHandlers() {
		// Handle text messages (coupon code queries)
		this.bot.on('message', async (msg) => {
			// Log all incoming messages
			console.log('🔍 [ADMIN_BOT] Received message:', {
				message_id: msg.message_id,
				date: new Date(msg.date * 1000).toISOString(),
				chat: {
					id: msg.chat.id,
					type: msg.chat.type,
					title: msg.chat.title,
					username: msg.chat.username,
					first_name: msg.chat.first_name,
					last_name: msg.chat.last_name
				},
				from: {
					id: msg.from?.id,
					is_bot: msg.from?.is_bot,
					first_name: msg.from?.first_name,
					last_name: msg.from?.last_name,
					username: msg.from?.username,
					language_code: msg.from?.language_code
				},
				text: msg.text,
				entities: msg.entities,
				reply_to_message: msg.reply_to_message ? {
					message_id: msg.reply_to_message.message_id,
					chat_id: msg.reply_to_message.chat.id
				} : null,
				forward_from_chat: msg.forward_from_chat ? {
					id: msg.forward_from_chat.id,
					type: msg.forward_from_chat.type,
					title: msg.forward_from_chat.title,
					username: msg.forward_from_chat.username
				} : null
			});

			if (msg.text && !msg.text.startsWith('/')) {
				await this.handleCouponCodeQuery(msg);
			}
		});

		// Handle callback queries (button clicks)
		this.bot.on('callback_query', async (callbackQuery) => {
			// Log all incoming callback queries
			console.log('🔘 [ADMIN_BOT] Received callback query:', {
				id: callbackQuery.id,
				from: {
					id: callbackQuery.from.id,
					is_bot: callbackQuery.from.is_bot,
					first_name: callbackQuery.from.first_name,
					last_name: callbackQuery.from.last_name,
					username: callbackQuery.from.username,
					language_code: callbackQuery.from.language_code
				},
				message: callbackQuery.message ? {
					message_id: callbackQuery.message.message_id,
					chat_id: callbackQuery.message.chat.id,
					date: new Date(callbackQuery.message.date * 1000).toISOString()
				} : null,
				chat_instance: callbackQuery.chat_instance,
				data: callbackQuery.data,
				inline_message_id: callbackQuery.inline_message_id
			});

			await this.handleCallbackQuery(callbackQuery);
		});

		// Log other bot events
		this.bot.on('polling_error', (error) => {
			console.error('❌ [ADMIN_BOT] Polling error:', error);
		});

		this.bot.on('webhook_error', (error) => {
			console.error('❌ [ADMIN_BOT] Webhook error:', error);
		});

		this.bot.on('error', (error) => {
			console.error('❌ [ADMIN_BOT] Bot error:', error);
		});

		console.log('✅ [ADMIN_BOT] Bot handlers setup completed');
	}

	async handleCouponCodeQuery(msg) {
		const chatId = msg.chat.id;
		const code = msg.text.trim().toUpperCase();

		console.log('🔍 [ADMIN_BOT] Processing coupon code query:', {
			chat_id: chatId,
			code: code,
			original_text: msg.text,
			user_id: msg.from?.id,
			username: msg.from?.username
		});

		try {
			// Find coupon code
			const couponCode = await this.prisma.couponCode.findUnique({
				where: { code: code },
				include: {
					sales_rule: true
				}
			});

			if (!couponCode) {
				console.log('❌ [ADMIN_BOT] Coupon not found:', { code: code });
				await this.bot.sendMessage(chatId, `❌ Купон с кодом "${code}" не найден.`);
				return;
			}

			console.log('✅ [ADMIN_BOT] Coupon found:', {
				coupon_id: couponCode.id,
				code: couponCode.code,
				chat_id: couponCode.chat_id,
				uses_count: couponCode.uses_count,
				max_uses: couponCode.max_uses,
				sales_rule_id: couponCode.sales_rule_id
			});

			// Get user info from chat_id
			const user = await this.prisma.user.findUnique({
				where: { chat_id: couponCode.chat_id }
			});

			if (!user) {
				console.log('❌ [ADMIN_BOT] User not found for coupon:', {
					coupon_code: code,
					chat_id: couponCode.chat_id
				});
				await this.bot.sendMessage(chatId, `❌ Пользователь с chat_id "${couponCode.chat_id}" не найден.`);
				return;
			}

			console.log('✅ [ADMIN_BOT] User found for coupon:', {
				user_id: user.id,
				chat_id: user.chat_id,
				first_name: user.first_name,
				last_name: user.last_name,
				username: user.username
			});

			// Check user subscription status using SubscriptionService
			// Note: SubscriptionService.checkSubscription already updates the database
			const subscriptionStatus = await this.checkUserSubscription(user);

			console.log('📺 [ADMIN_BOT] Subscription check result:', {
				user_id: user.id,
				chat_id: user.chat_id,
				is_subscribed: subscriptionStatus
			});

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

			console.log('📊 [ADMIN_BOT] Coupon usage status:', {
				coupon_id: couponCode.id,
				code: couponCode.code,
				uses_count: couponCode.uses_count,
				max_uses: couponCode.max_uses,
				is_fully_used: isFullyUsed
			});

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

			// Get sales buttons (render_type = 'sales') with coupon context
			const ButtonsService = require('./buttons.services');
			const buttonsService = new ButtonsService();
			const salesButtons = await buttonsService.getSalesButtons(couponCode.code);

			console.log('🔘 [ADMIN_BOT] Sales buttons retrieved:', {
				coupon_code: couponCode.code,
				buttons_count: salesButtons.inline_keyboard ? salesButtons.inline_keyboard.length : 0
			});

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

			// Add sales buttons if they exist
			if (salesButtons.inline_keyboard && salesButtons.inline_keyboard.length > 0) {
				salesButtons.inline_keyboard.forEach(row => {
					keyboard.inline_keyboard.push(row);
				});
			}

			console.log('📱 [ADMIN_BOT] Sending coupon info message:', {
				chat_id: chatId,
				message_length: message.length,
				keyboard_buttons: keyboard.inline_keyboard.length
			});

			await this.bot.sendMessage(chatId, message, {
				parse_mode: 'Markdown',
				reply_markup: keyboard
			});

			console.log('✅ [ADMIN_BOT] Coupon info message sent successfully');

		} catch (error) {
			console.error('❌ [ADMIN_BOT] Error handling coupon code query:', error);
			await this.bot.sendMessage(chatId, '❌ Произошла ошибка при поиске купона.');
		}
	}

	async handleCallbackQuery(callbackQuery) {
		const chatId = callbackQuery.message.chat.id;
		const data = callbackQuery.data;

		console.log('🔘 [ADMIN_BOT] Processing callback query:', {
			callback_id: callbackQuery.id,
			chat_id: chatId,
			user_id: callbackQuery.from.id,
			username: callbackQuery.from.username,
			callback_data: data,
			message_id: callbackQuery.message.message_id
		});

		if (data.startsWith('use_coupon:')) {
			const couponId = parseInt(data.split(':')[1]);
			console.log('🎫 [ADMIN_BOT] Use coupon callback detected:', { coupon_id: couponId });
			await this.useCoupon(chatId, couponId, callbackQuery.message);
		} else if (data === 'coupon_fully_used') {
			console.log('❌ [ADMIN_BOT] Coupon fully used callback detected');
			// Handle fully used coupon button click
			await this.bot.answerCallbackQuery(callbackQuery.id, {
				text: '❌ Купон уже полностью использован!',
				show_alert: true
			});
			return;
		} else {
			console.log('⚠️ [ADMIN_BOT] Unknown callback data:', { data: data });
		}

		// Answer callback query to remove loading state
		await this.bot.answerCallbackQuery(callbackQuery.id);
		console.log('✅ [ADMIN_BOT] Callback query answered');
	}

	async useCoupon(chatId, couponId, originalMessage) {
		console.log('🎫 [ADMIN_BOT] Processing coupon usage:', {
			chat_id: chatId,
			coupon_id: couponId,
			original_message_id: originalMessage.message_id
		});

		try {
			// Get coupon with current data
			const couponCode = await this.prisma.couponCode.findUnique({
				where: { id: couponId },
				include: {
					sales_rule: true
				}
			});

			if (!couponCode) {
				console.log('❌ [ADMIN_BOT] Coupon not found for usage:', { coupon_id: couponId });
				await this.bot.sendMessage(chatId, '❌ Купон не найден.');
				return;
			}

			console.log('✅ [ADMIN_BOT] Coupon retrieved for usage:', {
				coupon_id: couponCode.id,
				code: couponCode.code,
				current_uses: couponCode.uses_count,
				max_uses: couponCode.max_uses,
				sales_rule_id: couponCode.sales_rule_id
			});

			// Check if coupon can be used
			if (couponCode.uses_count >= couponCode.max_uses) {
				console.log('❌ [ADMIN_BOT] Coupon already fully used:', {
					coupon_id: couponCode.id,
					code: couponCode.code,
					uses_count: couponCode.uses_count,
					max_uses: couponCode.max_uses
				});

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

			console.log('✅ [ADMIN_BOT] Coupon usage updated:', {
				coupon_id: couponCode.id,
				code: couponCode.code,
				old_uses_count: couponCode.uses_count,
				new_uses_count: updatedCoupon.uses_count,
				used_at: updatedCoupon.used_at
			});

			// Get sales buttons (render_type = 'sales') with coupon context
			const ButtonsService = require('./buttons.services');
			const buttonsService = new ButtonsService();
			const salesButtons = await buttonsService.getSalesButtons(couponCode.code);

			console.log('🔘 [ADMIN_BOT] Sales buttons for usage message:', {
				coupon_code: couponCode.code,
				buttons_count: salesButtons.inline_keyboard ? salesButtons.inline_keyboard.length : 0
			});

			// Get admin_path configuration
			const configHelper = require('../configuration/config-helper');
			const adminPath = await configHelper.get('admin_path');

			console.log('⚙️ [ADMIN_BOT] Configuration retrieved:', {
				admin_path: adminPath
			});

			// Send success message
			const successMessage = `✅ **Купон использован!**\n\n` +
				`📋 **Код:**\n\`${couponCode.code}\`\n` +
				`📊 **Использовано:** ${updatedCoupon.uses_count}/${couponCode.max_uses}\n` +
				`⏰ **Время использования:** ${new Date().toLocaleString('ru-RU')}\n\n` +
				`💬 **Перейдите по ссылке ниже для оформления заказа:**`;

			// Create keyboard with order button and sales buttons
			let keyboard = {
				inline_keyboard: [[
					{
						text: '🎯 ОТРИМАТИ ЗНИЖКУ 🎯',
						url: `${adminPath}?text=${encodeURIComponent(`Доброго дня, бажаю зробити замовлення з SalesCode:\n${couponCode.code}`)}`
					}
				]]
			};

			// Add sales buttons if they exist
			if (salesButtons.inline_keyboard && salesButtons.inline_keyboard.length > 0) {
				salesButtons.inline_keyboard.forEach(row => {
					keyboard.inline_keyboard.push(row);
				});
			}

			console.log('📱 [ADMIN_BOT] Sending success message:', {
				chat_id: chatId,
				message_length: successMessage.length,
				keyboard_buttons: keyboard.inline_keyboard.length,
				order_button_url: keyboard.inline_keyboard[0][0].url
			});

			await this.bot.sendMessage(chatId, successMessage, {
				parse_mode: 'Markdown',
				reply_markup: keyboard
			});

			// Update the original message to show it's been used
			const updatedKeyboard = {
				inline_keyboard: [[
					{
						text: '✅ Купон использован',
						callback_data: 'coupon_used'
					}
				]]
			};

			console.log('🔄 [ADMIN_BOT] Updating original message keyboard:', {
				chat_id: chatId,
				message_id: originalMessage.message_id
			});

			await this.bot.editMessageReplyMarkup(updatedKeyboard, {
				chat_id: chatId,
				message_id: originalMessage.message_id
			});

			console.log('✅ [ADMIN_BOT] Coupon usage completed successfully');

		} catch (error) {
			console.error('❌ [ADMIN_BOT] Error using coupon:', error);
			await this.bot.sendMessage(chatId, '❌ Произошла ошибка при использовании купона.');
		}
	}

	async checkUserSubscription(user) {
		console.log('📺 [ADMIN_BOT] Checking user subscription:', {
			user_id: user.id,
			chat_id: user.chat_id,
			telegram_user_id: user.telegram_user_id,
			current_is_subscriber: user.is_subscriber
		});

		try {
			// Use existing SubscriptionService instead of duplicating logic
			const SubscriptionService = require('./subscription.service');
			const subscriptionService = new SubscriptionService();

			// Initialize with admin bot
			await subscriptionService.initialize(this.bot);

			console.log('🔧 [ADMIN_BOT] SubscriptionService initialized');

			// Check subscription using chat_id (existing method)
			const result = await subscriptionService.checkSubscription(user.chat_id);

			console.log('📺 [ADMIN_BOT] Subscription check completed:', {
				user_id: user.id,
				chat_id: user.chat_id,
				subscription_result: result,
				is_subscribed: result.isSubscribed
			});

			return result.isSubscribed;
		} catch (error) {
			console.error('❌ [ADMIN_BOT] Error checking user subscription:', {
				user_id: user.id,
				chat_id: user.chat_id,
				error: error.message,
				stack: error.stack
			});
			return false;
		}
	}

	async updateUserSubscriptionStatus(userId, isSubscribed) {
		console.log('📝 [ADMIN_BOT] Updating user subscription status:', {
			user_id: userId,
			new_is_subscriber: isSubscribed,
			timestamp: new Date().toISOString()
		});

		try {
			// Update user's subscription status and updatedAt timestamp
			const updatedUser = await this.prisma.user.update({
				where: { id: userId },
				data: {
					is_subscriber: isSubscribed,
					updatedAt: new Date()
				}
			});

			console.log('✅ [ADMIN_BOT] User subscription status updated successfully:', {
				user_id: userId,
				old_is_subscriber: !isSubscribed,
				new_is_subscriber: isSubscribed,
				updated_at: updatedUser.updatedAt
			});
		} catch (error) {
			console.error('❌ [ADMIN_BOT] Error updating user subscription status:', {
				user_id: userId,
				new_is_subscriber: isSubscribed,
				error: error.message,
				stack: error.stack
			});
		}
	}

	getBot() {
		return this.bot;
	}

	async stopBot() {
		console.log('🛑 [ADMIN_BOT] Stopping bot...');
		if (this.bot) {
			await this.bot.stopPolling();
			this.bot = null;
			console.log('✅ [ADMIN_BOT] Admin Bot stopped');
		} else {
			console.log('⚠️ [ADMIN_BOT] Bot was already stopped or not initialized.');
		}
	}
}

module.exports = AdminBotService; 