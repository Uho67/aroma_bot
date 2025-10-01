const express = require('express');
const AdminService = require('./admin.service');
const AuthMiddleware = require('../middleware/auth.middleware');

class AdminRouter {
  constructor() {
    this.router = express.Router();
    this.adminService = new AdminService();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    // Authentication routes (public)
    this.router.post('/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password are required' });
        }

        const admin = await this.adminService.authenticateAdmin(username, password);

        if (!admin) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        const token = await this.authMiddleware.createSession(admin.id);

        res.json({
          success: true,
          admin: admin,
          token: token
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
      }
    });

    this.router.post('/auth/logout', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (token) {
          await this.authMiddleware.deleteSession(token);
        }

        res.json({ success: true, message: 'Logged out successfully' });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
      }
    });

    // Protected routes (require authentication)
    this.router.get('/admins', this.authMiddleware.authenticate, async (req, res) => {
      try {
        const admins = await this.adminService.getAllAdmins();
        res.json(admins);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Admin creation endpoint removed - admins can only be created via script or database
    // This prevents unauthorized admin creation

    this.router.delete('/admins/:id', this.authMiddleware.authenticate, async (req, res) => {
      try {
        const { id } = req.params;
        await this.adminService.deleteAdmin(id);
        res.json({ message: 'Admin deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = AdminRouter; 