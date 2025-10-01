const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

class AuthMiddleware {
	constructor() {
		this.prisma = new PrismaClient();
	}

	/**
	 * Generate a random session token
	 * @returns {string} Random token
	 */
	generateToken() {
		return crypto.randomBytes(32).toString('hex');
	}

	/**
	 * Create a new admin session
	 * @param {number} adminId - Admin ID
	 * @returns {Promise<string>} Session token
	 */
	async createSession(adminId) {
		const token = this.generateToken();
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		await this.prisma.adminSession.create({
			data: {
				admin_id: adminId,
				token: token,
				expiresAt: expiresAt
			}
		});

		return token;
	}

	/**
	 * Validate session token
	 * @param {string} token - Session token
	 * @returns {Promise<Object|null>} Admin data if valid, null if invalid
	 */
	async validateSession(token) {
		if (!token) return null;

		try {
			const session = await this.prisma.adminSession.findUnique({
				where: { token },
				include: {
					admin: {
						select: {
							id: true,
							user_name: true,
							createdAt: true
						}
					}
				}
			});

			if (!session) return null;

			// Check if session is expired
			if (session.expiresAt < new Date()) {
				// Delete expired session
				await this.prisma.adminSession.delete({
					where: { token }
				});
				return null;
			}

			return session.admin;
		} catch (error) {
			console.error('Error validating session:', error);
			return null;
		}
	}

	/**
	 * Delete session (logout)
	 * @param {string} token - Session token
	 * @returns {Promise<void>}
	 */
	async deleteSession(token) {
		try {
			await this.prisma.adminSession.deleteMany({
				where: { token }
			});
		} catch (error) {
			console.error('Error deleting session:', error);
		}
	}

	/**
	 * Authentication middleware
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	authenticate = async (req, res, next) => {
		try {
			const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.authToken;

			if (!token) {
				return res.status(401).json({ error: 'Authentication required' });
			}

			const admin = await this.validateSession(token);

			if (!admin) {
				return res.status(401).json({ error: 'Invalid or expired session' });
			}

			req.admin = admin;
			next();
		} catch (error) {
			console.error('Authentication error:', error);
			res.status(500).json({ error: 'Authentication error' });
		}
	};

	/**
	 * Close Prisma connection
	 */
	async disconnect() {
		await this.prisma.$disconnect();
	}
}

module.exports = AuthMiddleware;
