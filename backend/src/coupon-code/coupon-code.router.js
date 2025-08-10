const express = require('express');
const CouponCodeService = require('./coupon-code.service');

class CouponCodeRouter {
	constructor() {
		this.router = express.Router();
		this.couponCodeService = new CouponCodeService();
		this.setupRoutes();
	}

	setupRoutes() {
		// Get all coupon codes
		this.router.get('/coupon-codes', async (req, res) => {
			try {
				const couponCodes = await this.couponCodeService.getAllCouponCodes();
				res.json(couponCodes);
			} catch (error) {
				res.status(500).json({ error: error.message });
			}
		});

		// Get coupon code by ID
		this.router.get('/coupon-codes/:id', async (req, res) => {
			try {
				const couponCode = await this.couponCodeService.getCouponCodeById(req.params.id);
				if (!couponCode) {
					return res.status(404).json({ error: 'Coupon code not found' });
				}
				res.json(couponCode);
			} catch (error) {
				res.status(500).json({ error: error.message });
			}
		});

		// Update coupon code
		this.router.put('/coupon-codes/:id', async (req, res) => {
			try {
				const couponCode = await this.couponCodeService.updateCouponCode(req.params.id, req.body);
				res.json(couponCode);
			} catch (error) {
				res.status(400).json({ error: error.message });
			}
		});

		// Delete coupon code
		this.router.delete('/coupon-codes/:id', async (req, res) => {
			try {
				const couponCode = await this.couponCodeService.deleteCouponCode(req.params.id);
				res.json({ message: 'Coupon code deleted successfully', couponCode });
			} catch (error) {
				res.status(400).json({ error: error.message });
			}
		});

		// Mark coupon code as sent
		this.router.put('/coupon-codes/:id/sent', async (req, res) => {
			try {
				const couponCode = await this.couponCodeService.markAsSent(req.params.id);
				res.json(couponCode);
			} catch (error) {
				res.status(400).json({ error: error.message });
			}
		});

		// Mark coupon code as used
		this.router.put('/coupon-codes/:id/used', async (req, res) => {
			try {
				const couponCode = await this.couponCodeService.markAsUsed(req.params.id);
				res.json(couponCode);
			} catch (error) {
				res.status(400).json({ error: error.message });
			}
		});
	}

	getRouter() {
		return this.router;
	}
}

module.exports = CouponCodeRouter; 