const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SalesRuleService {
	constructor() {
		// We'll get the bot service from the global instance when needed
	}

	getBotService() {
		// Get the bot service from the global instance
		try {
			const BotService = require('../telegram/bot.service');
			return BotService.getInstance();
		} catch (error) {
			console.error('Failed to get bot service instance:', error);
			return null;
		}
	}
	async createSalesRule(data) {
		try {
			const salesRule = await prisma.salesRule.create({
				data: {
					name: data.name,
					description: data.description,
					image: data.image,
					max_uses: data.max_uses
				}
			});
			return salesRule;
		} catch (error) {
			throw new Error(`Failed to create sales rule: ${error.message}`);
		}
	}

	async getAllSalesRules() {
		try {
			const salesRules = await prisma.salesRule.findMany({
				orderBy: { createdAt: 'desc' }
			});
			return salesRules;
		} catch (error) {
			throw new Error(`Failed to get sales rules: ${error.message}`);
		}
	}

	async getSalesRuleById(id) {
		try {
			const salesRule = await prisma.salesRule.findUnique({
				where: { id: parseInt(id) }
			});
			return salesRule;
		} catch (error) {
			throw new Error(`Failed to get sales rule: ${error.message}`);
		}
	}

	async updateSalesRule(id, data) {
		try {
			const salesRule = await prisma.salesRule.update({
				where: { id: parseInt(id) },
				data: {
					name: data.name,
					description: data.description,
					image: data.image,
					max_uses: data.max_uses
				}
			});
			return salesRule;
		} catch (error) {
			throw new Error(`Failed to update sales rule: ${error.message}`);
		}
	}

	async deleteSalesRule(id) {
		try {
			console.log(`🗑️ Deleting sales rule with ID: ${id}`);

			// First delete all related coupon codes
			const deletedCoupons = await prisma.couponCode.deleteMany({
				where: { sales_rule_id: parseInt(id) }
			});
			console.log(`🗑️ Deleted ${deletedCoupons.count} coupon codes`);

			// Find and delete UserSalesRule relations
			const deletedRelations = await prisma.userSalesRule.deleteMany({
				where: {
					sales_rule_id: parseInt(id)
				}
			});
			console.log(`👥 Deleted ${deletedRelations.count} UserSalesRule relations for sales rule ${id}`);

			// Then delete the sales rule
			const salesRule = await prisma.salesRule.delete({
				where: { id: parseInt(id) }
			});
			console.log(`✅ Sales rule ${id} deleted successfully`);
			return salesRule;
		} catch (error) {
			throw new Error(`Failed to delete sales rule: ${error.message}`);
		}
	}

	async sendToUsers(salesRuleId, chatIds) {
		try {
			const salesRule = await this.getSalesRuleById(salesRuleId);
			if (!salesRule) {
				throw new Error('Sales rule not found');
			}

			const couponCodes = [];

			for (const chatId of chatIds) {
				const code = this.generateCouponCode();

				const couponCode = await prisma.couponCode.create({
					data: {
						code: code,
						chat_id: chatId,
						max_uses: salesRule.max_uses,
						sales_rule_id: parseInt(salesRuleId)
					},
					include: {
						sales_rule: true
					}
				});

				couponCodes.push(couponCode);

								// Create UserSalesRule relation
				try {
					const user = await prisma.user.findUnique({
						where: { chat_id: chatId }
					});
					
					if (user) {
						// Check if relation already exists
						const existingRelation = await prisma.userSalesRule.findUnique({
							where: {
								user_id_sales_rule_id: {
									user_id: user.id,
									sales_rule_id: parseInt(salesRuleId)
								}
							}
						});
						
						if (!existingRelation) {
							// Create new relation
							await prisma.userSalesRule.create({
								data: {
									user_id: user.id,
									sales_rule_id: parseInt(salesRuleId)
								}
							});
							
							// Update user's updatedAt timestamp
							await prisma.user.update({
								where: { id: user.id },
								data: { updatedAt: new Date() }
							});
						}
					}
				} catch (dbError) {
					console.error(`Failed to create UserSalesRule relation for ${chatId}:`, dbError);
					// Don't fail the coupon creation if relation creation fails
				}

				// Send Telegram notification if bot service is available
				const botService = this.getBotService();
				if (botService) {
					try {
						await botService.sendCouponNotification(couponCode);
					} catch (error) {
						console.error(`Failed to send notification for coupon ${code}:`, error);
					}
				}
			}

			return couponCodes;
		} catch (error) {
			throw new Error(`Failed to send sales rule to users: ${error.message}`);
		}
	}

	generateCouponCode() {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < 10; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}
}

module.exports = SalesRuleService; 