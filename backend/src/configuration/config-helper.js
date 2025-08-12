const ConfigurationService = require('./configuration.service');

class ConfigHelper {
	constructor() {
		this.configService = new ConfigurationService();
		this.cache = new Map();
		this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
	}

	/**
	 * Get configuration value by path
	 * @param {string} path - Configuration path
	 * @param {string} defaultValue - Default value if config not found
	 * @returns {Promise<string>} Configuration value or default
	 */
	async get(path, defaultValue = null) {
		try {
			// Check cache first
			const cached = this.cache.get(path);
			if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
				return cached.value;
			}

			// Get from database
			const config = await this.configService.getConfig(path);

			if (config) {
				// Cache the result
				this.cache.set(path, {
					value: config.value,
					timestamp: Date.now()
				});
				return config.value;
			}

			return defaultValue;
		} catch (error) {
			console.error(`Error getting config ${path}:`, error);
			return defaultValue;
		}
	}

	/**
	 * Get multiple configurations at once
	 * @param {Array<string>} paths - Array of configuration paths
	 * @returns {Promise<Object>} Object with path-value pairs
	 */
	async getMultiple(paths) {
		const result = {};

		for (const path of paths) {
			result[path] = await this.get(path);
		}

		return result;
	}

	/**
	 * Set configuration value
	 * @param {string} path - Configuration path
	 * @param {string} value - Configuration value
	 * @returns {Promise<Object>} Updated configuration
	 */
	async set(path, value) {
		try {
			const config = await this.configService.upsertConfig(path, value);

			// Update cache
			this.cache.set(path, {
				value: config.value,
				timestamp: Date.now()
			});

			return config;
		} catch (error) {
			console.error(`Error setting config ${path}:`, error);
			throw error;
		}
	}

	/**
	 * Clear cache for specific path or all
	 * @param {string} path - Optional path to clear, if not provided clears all
	 */
	clearCache(path = null) {
		if (path) {
			this.cache.delete(path);
		} else {
			this.cache.clear();
		}
	}

	/**
	 * Get admin URL configuration
	 * @returns {Promise<string>} Admin URL or default
	 */
	async getAdminUrl() {
		return await this.get('admin_url', 'https://t.me/your_admin_bot');
	}

	/**
 * Get channel URL configuration
 * @returns {Promise<string>} Channel URL or default
 */
	async getChannelUrl() {
		return await this.get('channel', 'https://t.me/your_channel');
	}

	/**
	 * Get admin path configuration
	 * @returns {Promise<string>} Admin path or default
	 */
	async getAdminPath() {
		return await this.get('admin_path', 'https://t.me/your_admin_bot');
	}

	/**
	 * Close the configuration service connection
	 */
	async disconnect() {
		await this.configService.disconnect();
	}
}

// Export singleton instance
module.exports = new ConfigHelper(); 