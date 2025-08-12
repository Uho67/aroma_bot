const express = require('express');
const ConfigurationService = require('./configuration.service');

class ConfigurationRouter {
	constructor() {
		this.router = express.Router();
		this.configurationService = new ConfigurationService();
		this.setupRoutes();
	}

	setupRoutes() {
		// Get all configurations
		this.router.get('/configurations', async (req, res) => {
			try {
				const configs = await this.configurationService.getAllConfigs();
				res.json(configs);
			} catch (error) {
				console.error('Error getting configurations:', error);
				res.status(500).json({ error: error.message });
			}
		});

		// Get configuration by path
		this.router.get('/configurations/:path', async (req, res) => {
			try {
				const { path } = req.params;
				const config = await this.configurationService.getConfig(path);

				if (!config) {
					return res.status(404).json({ error: 'Configuration not found' });
				}

				res.json(config);
			} catch (error) {
				console.error('Error getting configuration:', error);
				res.status(500).json({ error: error.message });
			}
		});

		// Create new configuration
		this.router.post('/configurations', async (req, res) => {
			try {
				const { path, value } = req.body;

				if (!path || !value) {
					return res.status(400).json({ error: 'Path and value are required' });
				}

				const config = await this.configurationService.addConfig({ path, value });
				res.status(201).json(config);
			} catch (error) {
				console.error('Error creating configuration:', error);

				if (error.code === 'P2002') {
					res.status(409).json({ error: 'Configuration with this path already exists' });
				} else {
					res.status(500).json({ error: error.message });
				}
			}
		});

		// Update configuration
		this.router.put('/configurations/:path', async (req, res) => {
			try {
				const { path } = req.params;
				const { value } = req.body;

				if (!value) {
					return res.status(400).json({ error: 'Value is required' });
				}

				const config = await this.configurationService.updateConfig(path, value);
				res.json(config);
			} catch (error) {
				console.error('Error updating configuration:', error);

				if (error.code === 'P2025') {
					res.status(404).json({ error: 'Configuration not found' });
				} else {
					res.status(500).json({ error: error.message });
				}
			}
		});

		// Upsert configuration (create if not exists, update if exists)
		this.router.post('/configurations/:path/upsert', async (req, res) => {
			try {
				const { path } = req.params;
				const { value } = req.body;

				if (!value) {
					return res.status(400).json({ error: 'Value is required' });
				}

				const config = await this.configurationService.upsertConfig(path, value);
				res.json(config);
			} catch (error) {
				console.error('Error upserting configuration:', error);
				res.status(500).json({ error: error.message });
			}
		});

		// Delete configuration
		this.router.delete('/configurations/:path', async (req, res) => {
			try {
				const { path } = req.params;
				const config = await this.configurationService.deleteConfig(path);
				res.json({ message: 'Configuration deleted successfully', config });
			} catch (error) {
				console.error('Error deleting configuration:', error);

				if (error.code === 'P2025') {
					res.status(404).json({ error: 'Configuration not found' });
				} else {
					res.status(500).json({ error: error.message });
				}
			}
		});
	}

	getRouter() {
		return this.router;
	}
}

module.exports = ConfigurationRouter; 