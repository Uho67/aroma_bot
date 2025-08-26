const express = require('express');
const SalesRuleService = require('./sales-rule.service');

class SalesRuleRouter {
	constructor() {
		this.router = express.Router();
		this.salesRuleService = new SalesRuleService();
		this.setupRoutes();
	}

	setupRoutes() {
		// Create new sales rule
		this.router.post('/sales-rules', async (req, res) => {
			try {
				const salesRule = await this.salesRuleService.createSalesRule(req.body);
				res.status(201).json(salesRule);
			} catch (error) {
				res.status(400).json({ error: error.message });
			}
		});

		// Get all sales rules
		this.router.get('/sales-rules', async (req, res) => {
			try {
				const salesRules = await this.salesRuleService.getAllSalesRules();
				res.json(salesRules);
			} catch (error) {
				res.status(500).json({ error: error.message });
			}
		});

		// Get sales rule by ID
		this.router.get('/sales-rules/:id', async (req, res) => {
			try {
				const salesRule = await this.salesRuleService.getSalesRuleById(req.params.id);
				if (!salesRule) {
					return res.status(404).json({ error: 'Sales rule not found' });
				}
				res.json(salesRule);
			} catch (error) {
				res.status(500).json({ error: error.message });
			}
		});

		// Update sales rule
		this.router.put('/sales-rules/:id', async (req, res) => {
			try {
				const salesRule = await this.salesRuleService.updateSalesRule(req.params.id, req.body);
				res.json(salesRule);
			} catch (error) {
				res.status(400).json({ error: error.message });
			}
		});

		// Delete sales rule
		this.router.delete('/sales-rules/:id', async (req, res) => {
			try {
				const salesRule = await this.salesRuleService.deleteSalesRule(req.params.id);
				res.json({ message: 'Sales rule deleted successfully', salesRule });
			} catch (error) {
				res.status(400).json({ error: error.message });
			}
		});

		// Send sales rule to users (теперь добавляет в очередь)
		this.router.post('/sales-rules/:id/send', async (req, res) => {
			try {
				const { userIds } = req.body;
				if (!userIds || !Array.isArray(userIds)) {
					return res.status(400).json({ error: 'User IDs array is required' });
				}

				// Вместо отправки купонов сразу, добавляем в очередь
				const result = await this.salesRuleService.addToQueue(req.params.id, userIds);
				res.json({
					success: true,
					message: `Added ${result.length} users to queue for sales rule`,
					queuedCount: result.length
				});
			} catch (error) {
				res.status(400).json({ error: error.message });
			}
		});
	}

	getRouter() {
		return this.router;
	}
}

module.exports = SalesRuleRouter; 