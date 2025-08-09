const express = require('express');
const AdminService = require('./admin.service');

class AdminRouter {
  constructor() {
    this.router = express.Router();
    this.adminService = new AdminService();
    this.setupRoutes();
  }

  setupRoutes() {
    // Get all admins
    this.router.get('/admins', async (req, res) => {
      try {
        const admins = await this.adminService.getAllAdmins();
        res.json(admins);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create new admin
    this.router.post('/admins', async (req, res) => {
      try {
        const { user_name } = req.body;
        
        if (!user_name || user_name.trim() === '') {
          return res.status(400).json({ error: 'Username is required' });
        }

        const admin = await this.adminService.createAdmin({ user_name: user_name.trim() });
        res.json(admin);
      } catch (error) {
        if (error.code === 'P2002') {
          res.status(400).json({ error: 'Admin with this username already exists' });
        } else {
          res.status(500).json({ error: error.message });
        }
      }
    });

    // Delete admin
    this.router.delete('/admins/:id', async (req, res) => {
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