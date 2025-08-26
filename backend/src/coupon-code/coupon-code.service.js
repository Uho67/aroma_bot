const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CouponCodeService {
	async getAllCouponCodes() {
		try {
			const couponCodes = await prisma.couponCode.findMany({
				include: {
					sales_rule: {
						select: {
							id: true,
							name: true,
							description: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			});
			return couponCodes;
		} catch (error) {
			throw new Error(`Failed to get coupon codes: ${error.message}`);
		}
	}

	async getAllCouponCodesWithFilters(filters = {}) {
		try {
			const where = {};
			
			// Filter by usage status
			if (filters.usageStatus === 'used') {
				where.uses_count = { gt: 0 };
			} else if (filters.usageStatus === 'unused') {
				where.uses_count = 0;
			}
			
			// Filter by creation date range
			if (filters.dateFrom || filters.dateTo) {
				where.createdAt = {};
				if (filters.dateFrom) {
					where.createdAt.gte = new Date(filters.dateFrom);
				}
				if (filters.dateTo) {
					where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
				}
			}

			const couponCodes = await prisma.couponCode.findMany({
				where,
				include: {
					sales_rule: {
						select: {
							id: true,
							name: true,
							description: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			});
			return couponCodes;
		} catch (error) {
			throw new Error(`Failed to get coupon codes with filters: ${error.message}`);
		}
	}

	async getCouponCodeById(id) {
		try {
			const couponCode = await prisma.couponCode.findUnique({
				where: { id: parseInt(id) },
				include: {
					sales_rule: true
				}
			});
			return couponCode;
		} catch (error) {
			throw new Error(`Failed to get coupon code: ${error.message}`);
		}
	}

	async updateCouponCode(id, data) {
		try {
			const couponCode = await prisma.couponCode.update({
				where: { id: parseInt(id) },
				data: {
					uses_count: data.uses_count,
					used_at: data.used_at,
					is_sent: data.is_sent
				}
			});
			return couponCode;
		} catch (error) {
			throw new Error(`Failed to update coupon code: ${error.message}`);
		}
	}

	async deleteCouponCode(id) {
		try {
			const couponCode = await prisma.couponCode.delete({
				where: { id: parseInt(id) }
			});
			return couponCode;
		} catch (error) {
			throw new Error(`Failed to delete coupon code: ${error.message}`);
		}
	}

	async markAsSent(id) {
		try {
			const couponCode = await prisma.couponCode.update({
				where: { id: parseInt(id) },
				data: { is_sent: true }
			});
			return couponCode;
		} catch (error) {
			throw new Error(`Failed to mark coupon code as sent: ${error.message}`);
		}
	}

	async markAsUsed(id) {
		try {
			const couponCode = await prisma.couponCode.update({
				where: { id: parseInt(id) },
				data: {
					uses_count: { increment: 1 },
					used_at: new Date()
				}
			});
			return couponCode;
		} catch (error) {
			throw new Error(`Failed to mark coupon code as used: ${error.message}`);
		}
	}
}

module.exports = CouponCodeService; 