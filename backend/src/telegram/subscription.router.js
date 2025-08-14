const express = require('express');
const SubscriptionService = require('./subscription.service');

class SubscriptionRouter {
	constructor() {
		this.router = express.Router();
		this.subscriptionService = new SubscriptionService();
		this.setupRoutes();
	}

	setupRoutes() {
		// Check single user subscription
		this.router.get('/subscription/:chatId', async (req, res) => {
			try {
				const { chatId } = req.params;
				const result = await this.subscriptionService.checkSubscription(chatId);
				res.json(result);
			} catch (error) {
				console.error('Error checking subscription:', error);
				res.status(500).json({ error: error.message });
			}
		});

		// Check multiple users subscriptions
		this.router.post('/subscription/check-multiple', async (req, res) => {
			try {
				const { chatIds } = req.body;

				if (!chatIds || !Array.isArray(chatIds)) {
					return res.status(400).json({ error: 'chatIds array is required' });
				}

				const results = await this.subscriptionService.checkMultipleSubscriptions(chatIds);
				res.json(results);
			} catch (error) {
				console.error('Error checking multiple subscriptions:', error);
				res.status(500).json({ error: error.message });
			}
		});

		// Get channel information
		this.router.get('/subscription/channel-info', async (req, res) => {
			try {
				const channelInfo = await this.subscriptionService.getChannelInfo();
				if (channelInfo) {
					res.json(channelInfo);
				} else {
					res.status(404).json({ error: 'Channel information not available' });
				}
			} catch (error) {
				console.error('Error getting channel info:', error);
				res.status(500).json({ error: error.message });
			}
		});

		// Get subscription service status
		this.router.get('/subscription/status', async (req, res) => {
			try {
				const channelInfo = await this.subscriptionService.getChannelInfo();
				if (channelInfo) {
					res.json({
						status: 'active',
						channel: channelInfo,
						message: 'Subscription service is working'
					});
				} else {
					res.json({
						status: 'inactive',
						message: 'Subscription service not configured or admin bot not admin of channel'
					});
				}
			} catch (error) {
				console.error('Error getting subscription status:', error);
				res.status(500).json({ error: error.message });
			}
		});
	}

	getRouter() {
		return this.router;
	}
}

module.exports = SubscriptionRouter; 