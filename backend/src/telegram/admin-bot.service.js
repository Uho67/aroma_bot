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
			// Check if message is forwarded from a channel
			if (msg.forward_from_chat && msg.forward_from_chat.type === 'channel') {
				await this.handleForwardedMessage(msg);
			} else if (msg.text && !msg.text.startsWith('/')) {
				await this.handleCouponCodeQuery(msg);
			}
		});

		// Handle callback queries (button clicks)
		this.bot.on('callback_query', async (callbackQuery) => {
			await this.handleCallbackQuery(callbackQuery);
		});
	}

	async handleForwardedMessage(msg) {
		try {
			const chatId = msg.chat.id;
			const forwardInfo = msg.forward_from_chat;
			const forwardDate = msg.forward_date;
			const forwardSignature = msg.forward_signature;
			const forwardSenderName = msg.forward_sender_name;

			// Extract comprehensive channel information
			const channelInfo = {
				// Channel identification
				channelId: forwardInfo.id,
				channelTitle: forwardInfo.title,
				channelUsername: forwardInfo.username,
				channelType: forwardInfo.type,

				// Message information
				messageId: msg.message_id,
				messageText: msg.text || msg.caption || 'No text content',
				messageType: msg.photo ? 'photo' : msg.video ? 'video' : msg.document ? 'document' : msg.audio ? 'audio' : msg.voice ? 'voice' : msg.sticker ? 'sticker' : 'text',

				// Forward information
				forwardDate: forwardDate ? new Date(forwardDate * 1000).toISOString() : null,
				forwardSignature: forwardSignature,
				forwardSenderName: forwardSenderName,

				// Media information
				hasPhoto: !!msg.photo,
				hasVideo: !!msg.video,
				hasDocument: !!msg.document,
				hasAudio: !!msg.audio,
				hasVoice: !!msg.voice,
				hasSticker: !!msg.sticker,

				// Media details
				photoInfo: msg.photo ? {
					fileId: msg.photo[msg.photo.length - 1].file_id,
					width: msg.photo[msg.photo.length - 1].width,
					height: msg.photo[msg.photo.length - 1].height,
					fileSize: msg.photo[msg.photo.length - 1].file_size
				} : null,
				videoInfo: msg.video ? {
					fileId: msg.video.file_id,
					width: msg.video.width,
					height: msg.video.height,
					duration: msg.video.duration,
					fileSize: msg.video.file_size
				} : null,
				documentInfo: msg.document ? {
					fileId: msg.document.file_id,
					fileName: msg.document.file_name,
					mimeType: msg.document.mime_type,
					fileSize: msg.document.file_size
				} : null,

				// Additional metadata
				receivedAt: new Date().toISOString(),
				receivedByChatId: chatId,
				receivedByUserId: msg.from?.id,
				receivedByUsername: msg.from?.username,
				receivedByFirstName: msg.from?.first_name,
				receivedByLastName: msg.from?.last_name
			};

			// Log all channel and post information
			console.log('📢 FORWARDED MESSAGE FROM CHANNEL:');
			console.log('=====================================');
			console.log(`🆔 Channel ID: ${channelInfo.channelId}`);
			console.log(`📺 Channel Title: ${channelInfo.channelTitle}`);
			console.log(`👤 Channel Username: @${channelInfo.channelUsername || 'N/A'}`);
			console.log(`📝 Message Type: ${channelInfo.messageType}`);
			console.log(`📄 Message Text: ${channelInfo.messageText}`);
			console.log(`📅 Forward Date: ${channelInfo.forwardDate || 'N/A'}`);
			console.log(`✍️ Forward Signature: ${channelInfo.forwardSignature || 'N/A'}`);
			console.log(`👤 Forward Sender: ${channelInfo.forwardSenderName || 'N/A'}`);
			console.log(`📱 Media Types: Photo: ${channelInfo.hasPhoto}, Video: ${channelInfo.hasVideo}, Document: ${channelInfo.hasDocument}, Audio: ${channelInfo.hasAudio}, Voice: ${channelInfo.hasVoice}, Sticker: ${channelInfo.hasSticker}`);

			// Log media details if present
			if (channelInfo.photoInfo) {
				console.log(`📸 Photo Details: ${channelInfo.photoInfo.width}x${channelInfo.photoInfo.height}, Size: ${channelInfo.photoInfo.fileSize || 'Unknown'} bytes`);
			}
			if (channelInfo.videoInfo) {
				console.log(`🎥 Video Details: ${channelInfo.videoInfo.width}x${channelInfo.videoInfo.height}, Duration: ${channelInfo.videoInfo.duration}s, Size: ${channelInfo.videoInfo.fileSize || 'Unknown'} bytes`);
			}
			if (channelInfo.documentInfo) {
				console.log(`📄 Document Details: ${channelInfo.documentInfo.fileName}, Type: ${channelInfo.documentInfo.mimeType}, Size: ${channelInfo.documentInfo.fileSize || 'Unknown'} bytes`);
			}

			console.log(`⏰ Received At: ${channelInfo.receivedAt}`);
			console.log(`💬 Received By Chat ID: ${channelInfo.receivedByChatId}`);
			console.log(`👤 Received By User: ${channelInfo.receivedByFirstName || ''} ${channelInfo.receivedByLastName || ''} (@${channelInfo.receivedByUsername || 'N/A'}) (ID: ${channelInfo.receivedByUserId})`);
			console.log('=====================================');

			// Send confirmation message to admin
			let confirmationMessage = `📢 **Forwarded Message Detected**\n\n` +
				`🆔 **Channel ID:** \`${channelInfo.channelId}\`\n` +
				`📺 **Channel:** ${channelInfo.channelTitle}\n` +
				`👤 **Username:** @${channelInfo.channelUsername || 'N/A'}\n` +
				`📝 **Message Type:** ${channelInfo.messageType}\n` +
				`📄 **Content:** ${channelInfo.messageText.substring(0, 100)}${channelInfo.messageText.length > 100 ? '...' : ''}\n` +
				`📅 **Forward Date:** ${channelInfo.forwardDate || 'N/A'}\n` +
				`⏰ **Received:** ${new Date().toLocaleString('ru-RU')}`;

			// Add media details to confirmation message
			if (channelInfo.photoInfo) {
				confirmationMessage += `\n📸 **Photo:** ${channelInfo.photoInfo.width}x${channelInfo.photoInfo.height}`;
			}
			if (channelInfo.videoInfo) {
				confirmationMessage += `\n🎥 **Video:** ${channelInfo.videoInfo.width}x${channelInfo.videoInfo.height}, ${channelInfo.videoInfo.duration}s`;
			}
			if (channelInfo.documentInfo) {
				confirmationMessage += `\n📄 **Document:** ${channelInfo.documentInfo.fileName}`;
			}

			await this.bot.sendMessage(chatId, confirmationMessage, {
				parse_mode: 'Markdown'
			});

		} catch (error) {
			console.error('Error handling forwarded message:', error);
			// Send error notification to admin
			await this.bot.sendMessage(msg.chat.id, '❌ Error processing forwarded message. Check logs for details.');
		}
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

			// Get sales buttons (render_type = 'sales') with coupon context
			const ButtonsService = require('./buttons.services');
			const buttonsService = new ButtonsService();
			const salesButtons = await buttonsService.getSalesButtons(couponCode.code);

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

			// Get sales buttons (render_type = 'sales') with coupon context
			const ButtonsService = require('./buttons.services');
			const buttonsService = new ButtonsService();
			const salesButtons = await buttonsService.getSalesButtons(couponCode.code);

			// Get admin_path configuration
			const configHelper = require('../configuration/config-helper');
			const adminPath = await configHelper.get('admin_path');

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