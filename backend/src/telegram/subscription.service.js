const configHelper = require('../configuration/config-helper');

class SubscriptionService {
	constructor() {
		this.adminBot = null;
		this.channelUsername = null;
	}

	/**
	 * Initialize the service with admin bot instance
	 * @param {Object} adminBot - Admin bot instance
	 */
	async initialize(adminBot) {
		try {
			this.adminBot = adminBot;
			this.channelUsername = await configHelper.get('channel_username', '');

			if (!this.channelUsername) {
				console.warn('⚠️ channel_username not configured. Subscription checking will not work.');
			}

			console.log('✅ Subscription service initialized with admin bot');
		} catch (error) {
			console.error('❌ Error initializing subscription service:', error);
		}
	}

	/**
 * Check if user is subscribed to the channel by chat_id
 * @param {string} chatId - User's chat ID
 * @returns {Promise<Object>} Subscription status
 */
	async checkSubscription(chatId) {
		try {
			if (!this.adminBot || !this.channelUsername) {
				return {
					isSubscribed: false,
					error: 'Subscription service not properly configured'
				};
			}

			// Get channel info first
			const channelInfo = await this.adminBot.getChat(this.channelUsername);
			if (!channelInfo) {
				return {
					isSubscribed: false,
					error: 'Channel not found or admin bot is not admin'
				};
			}

			// Check user's membership in the channel
			const member = await this.adminBot.getChatMember(this.channelUsername, chatId);

			if (!member) {
				return {
					isSubscribed: false,
					error: 'Could not get member info'
				};
			}

			// Check subscription status based on member status
			const isSubscribed = this.isValidMemberStatus(member.status);

			// Update user's subscription status in database
			try {
				const { PrismaClient } = require('@prisma/client');
				const prisma = new PrismaClient();

				await prisma.user.update({
					where: { chat_id: chatId },
					data: {
						is_subscriber: isSubscribed,
						updatedAt: new Date() // Update the timestamp
					}
				});

				await prisma.$disconnect();
			} catch (dbError) {
				console.error('Error updating user subscription status:', dbError);
				// Don't fail the subscription check if DB update fails
			}

			return {
				isSubscribed,
				status: member.status,
				channelTitle: channelInfo.title,
				channelUsername: this.channelUsername,
				memberInfo: member
			};

		} catch (error) {
			console.error('Error checking subscription:', error);

			// Handle specific Telegram errors
			if (error.code === 'ETELEGRAM') {
				if (error.response.statusCode === 403) {
					return {
						isSubscribed: false,
						error: 'Admin bot is not admin of the channel'
					};
				} else if (error.response.statusCode === 400) {
					return {
						isSubscribed: false,
						error: 'Invalid channel username or user not found'
					};
				}
			}

			return {
				isSubscribed: false,
				error: error.message
			};
		}
	}

	/**
	 * Check if user is subscribed to the channel by telegram_user_id
	 * @param {number} telegramUserId - User's Telegram user ID
	 * @returns {Promise<Object>} Subscription status
	 */
	async checkSubscriptionByTelegramId(telegramUserId) {
		try {
			if (!this.adminBot || !this.channelUsername) {
				return {
					isSubscribed: false,
					error: 'Subscription service not properly configured'
				};
			}

			// Get channel info first
			const channelInfo = await this.adminBot.getChat(this.channelUsername);
			if (!channelInfo) {
				return {
					isSubscribed: false,
					error: 'Channel not found or admin bot is not admin'
				};
			}

			// Check user's membership in the channel using telegram_user_id
			const member = await this.adminBot.getChatMember(channelInfo.id, telegramUserId);

			if (!member) {
				return {
					isSubscribed: false,
					error: 'Could not get member info'
				};
			}

			// Check subscription status based on member status
			const isSubscribed = this.isValidMemberStatus(member.status);

			return {
				isSubscribed,
				status: member.status,
				channelTitle: channelInfo.title,
				channelUsername: this.channelUsername,
				memberInfo: member
			};

		} catch (error) {
			console.error('Error checking subscription by telegram ID:', error);

			// Handle specific Telegram errors
			if (error.code === 'ETELEGRAM') {
				if (error.response.statusCode === 403) {
					return {
						isSubscribed: false,
						error: 'Admin bot is not admin of the channel'
					};
				} else if (error.response.statusCode === 400) {
					return {
						isSubscribed: false,
						error: 'Invalid channel username or user not found'
					};
				}
			}

			return {
				isSubscribed: false,
				error: error.message
			};
		}
	}

	/**
	 * Check if member status indicates valid subscription
	 * @param {string} status - Member status from Telegram
	 * @returns {boolean} True if subscribed
	 */
	isValidMemberStatus(status) {
		const validStatuses = ['member', 'administrator', 'creator'];
		return validStatuses.includes(status);
	}

	/**
	 * Get subscription status for multiple users
	 * @param {Array<string>} chatIds - Array of user chat IDs
	 * @returns {Promise<Array>} Array of subscription results
	 */
	async checkMultipleSubscriptions(chatIds) {
		const results = [];

		for (const chatId of chatIds) {
			const result = await this.checkSubscription(chatId);
			results.push({
				chatId,
				...result
			});
		}

		return results;
	}

	/**
 * Get channel information
 * @returns {Promise<Object>} Channel info
 */
	async getChannelInfo() {
		try {
			if (!this.adminBot || !this.channelUsername) {
				return null;
			}

			const channelInfo = await this.adminBot.getChat(`@${this.channelUsername}`);
			return {
				title: channelInfo.title,
				username: channelInfo.username,
				description: channelInfo.description,
				memberCount: channelInfo.member_count,
				photo: channelInfo.photo
			};
		} catch (error) {
			console.error('Error getting channel info:', error);
			return null;
		}
	}

	/**
 * Close admin bot connection
 */
	async disconnect() {
		if (this.adminBot) {
			await this.adminBot.close();
		}
	}
}

module.exports = SubscriptionService; 