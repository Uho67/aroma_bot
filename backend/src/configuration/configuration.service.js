const { PrismaClient } = require('@prisma/client');

class ConfigurationService {
	constructor() {
		this.prisma = new PrismaClient();
	}

	/**
	 * Add new configuration
	 * @param {Object} configData - Configuration data
	 * @param {string} configData.path - Unique path/key for the configuration
	 * @param {string} configData.value - Value of the configuration
	 * @returns {Promise<Object>} Created configuration object
	 */
	async addConfig(configData) {
		try {
			const config = await this.prisma.configuration.create({
				data: {
					path: configData.path,
					value: configData.value
				}
			});
			return config;
		} catch (error) {
			console.error('Error creating configuration:', error);
			throw error;
		}
	}

	/**
	 * Get configuration by path
	 * @param {string} path - Configuration path/key
	 * @returns {Promise<Object|null>} Configuration object or null if not found
	 */
	async getConfig(path) {
		try {
			const config = await this.prisma.configuration.findUnique({
				where: {
					path: path
				}
			});
			return config;
		} catch (error) {
			console.error('Error getting configuration:', error);
			throw error;
		}
	}

	/**
	 * Update configuration by path
	 * @param {string} path - Configuration path/key
	 * @param {string} value - New value
	 * @returns {Promise<Object>} Updated configuration object
	 */
	async updateConfig(path, value) {
		try {
			const config = await this.prisma.configuration.update({
				where: {
					path: path
				},
				data: {
					value: value
				}
			});
			return config;
		} catch (error) {
			console.error('Error updating configuration:', error);
			throw error;
		}
	}

	/**
	 * Delete configuration by path
	 * @param {string} path - Configuration path/key
	 * @returns {Promise<Object>} Deleted configuration object
	 */
	async deleteConfig(path) {
		try {
			const config = await this.prisma.configuration.delete({
				where: {
					path: path
				}
			});
			return config;
		} catch (error) {
			console.error('Error deleting configuration:', error);
			throw error;
		}
	}

	/**
	 * Get all configurations
	 * @returns {Promise<Array>} Array of all configurations
	 */
	async getAllConfigs() {
		try {
			const configs = await this.prisma.configuration.findMany({
				orderBy: {
					createdAt: 'desc'
				}
			});
			return configs;
		} catch (error) {
			console.error('Error getting all configurations:', error);
			throw error;
		}
	}

	/**
	 * Upsert configuration (create if not exists, update if exists)
	 * @param {string} path - Configuration path/key
	 * @param {string} value - Configuration value
	 * @returns {Promise<Object>} Configuration object
	 */
	async upsertConfig(path, value) {
		try {
			const config = await this.prisma.configuration.upsert({
				where: {
					path: path
				},
				update: {
					value: value
				},
				create: {
					path: path,
					value: value
				}
			});
			return config;
		} catch (error) {
			console.error('Error upserting configuration:', error);
			throw error;
		}
	}

	/**
	 * Close Prisma connection
	 */
	async disconnect() {
		await this.prisma.$disconnect();
	}
}

module.exports = ConfigurationService; 