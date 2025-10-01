class AuthService {
	constructor() {
		this.baseURL = '/api';
		this.token = localStorage.getItem('adminToken');
		this.user = JSON.parse(localStorage.getItem('adminUser') || 'null');
	}

	/**
	 * Login with username and password
	 * @param {string} username 
	 * @param {string} password 
	 * @returns {Promise<Object>} Login response
	 */
	async login(username, password) {
		try {
			const response = await fetch(`${this.baseURL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, password })
			});

			const data = await response.json();

			if (data.success) {
				this.token = data.token;
				this.user = data.admin;

				// Store in localStorage
				localStorage.setItem('adminToken', data.token);
				localStorage.setItem('adminUser', JSON.stringify(data.admin));

				return data;
			} else {
				throw new Error(data.error || 'Login failed');
			}
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	}

	/**
	 * Logout and clear session
	 * @returns {Promise<void>}
	 */
	async logout() {
		try {
			if (this.token) {
				await fetch(`${this.baseURL}/auth/logout`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${this.token}`,
						'Content-Type': 'application/json',
					}
				});
			}
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			// Clear local data
			this.token = null;
			this.user = null;
			localStorage.removeItem('adminToken');
			localStorage.removeItem('adminUser');
		}
	}

	/**
	 * Check if user is authenticated
	 * @returns {boolean}
	 */
	isAuthenticated() {
		return !!this.token && !!this.user;
	}

	/**
	 * Get current user
	 * @returns {Object|null}
	 */
	getCurrentUser() {
		return this.user;
	}

	/**
	 * Get auth token
	 * @returns {string|null}
	 */
	getToken() {
		return this.token;
	}

	/**
	 * Make authenticated API request
	 * @param {string} url 
	 * @param {Object} options 
	 * @returns {Promise<Response>}
	 */
	async authenticatedRequest(url, options = {}) {
		if (!this.token) {
			throw new Error('No authentication token found');
		}

		const defaultOptions = {
			headers: {
				'Authorization': `Bearer ${this.token}`,
				'Content-Type': 'application/json',
			}
		};

		const response = await fetch(url, {
			...defaultOptions,
			...options,
			headers: {
				...defaultOptions.headers,
				...options.headers
			}
		});

		if (response.status === 401) {
			// Token expired or invalid
			await this.logout();
			window.location.href = '/login';
			throw new Error('Authentication expired');
		}

		return response;
	}

	/**
	 * Make API request with automatic authentication
	 * @param {string} endpoint 
	 * @param {Object} options 
	 * @returns {Promise<Response>}
	 */
	async apiRequest(endpoint, options = {}) {
		const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

		// Define protected routes (admin panel routes that require authentication)
		const protectedRoutes = [
			'/admins',           // Admin management
			'/posts',            // Post management  
			'/buttons',          // Button management
			'/users',            // User management
			'/sales-rules',      // Sales rules management
			'/coupons',          // Coupon management
			'/cron',             // Cron management
			'/configurations'    // Configuration management
		];

		// Check if it's a protected admin route
		const isProtectedRoute = protectedRoutes.some(route => endpoint.includes(route));

		if (isProtectedRoute) {
			// Protected route - requires authentication (admin panel routes)
			return this.authenticatedRequest(url, options);
		} else {
			// Public route - no authentication required
			// This includes: /auth/login, /auth/logout, /telegram, /bot, /subscription, /upload, webhooks, etc.
			return fetch(url, options);
		}
	}
}

// Export singleton instance
export default new AuthService();
