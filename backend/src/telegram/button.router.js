const express = require('express');
const ButtonsService = require('./buttons.services');

class ButtonRouter {
  constructor() {
    this.router = express.Router();
    this.buttonsService = new ButtonsService();
    this.setupRoutes();
  }

  setupRoutes() {
    // Get all buttons
    this.router.get('/buttons', async (req, res) => {
      try {
        const buttons = await this.buttonsService.getAllButtons();
        res.json(buttons);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create new button
    this.router.post('/buttons', async (req, res) => {
      try {
        const { name, type, value, render_type } = req.body;
        const order = req.body.order ? parseInt(req.body.order, 10) : 0; // Default to 0 if order is empty
        const button = await this.buttonsService.createButton({
          render_type,
          name,
          type,
          value,
          order
        });
        res.json(button);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Update button
    this.router.put('/buttons/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { name, type, value, order } = req.body;
        const button = await this.buttonsService.updateButton(parseInt(id), {
          name,
          type,
          value,
          order
        });
        res.json(button);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Delete button
    this.router.delete('/buttons/:id', async (req, res) => {
      try {
        const { id } = req.params;
        await this.buttonsService.deleteButton(parseInt(id));
        res.json({ message: 'Button deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ButtonRouter; 