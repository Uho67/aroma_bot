const { PrismaClient } = require('@prisma/client'); // Import PrismaClient
const ButtonInterface = require('./button.interface');
const configHelper = require('../configuration/config-helper');

class ButtonsService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getWelcomeMenuButtons() {
    return await this.getButtonByRendererType([
      { render_type: null },
      { render_type: ButtonInterface.admin_render_type },
      { render_type: ButtonInterface.welcome_render_type }
    ]);
  }

  async getCatalogMenuButtons() {
    const buttons = await this.getButtonByRendererType([
      { render_type: ButtonInterface.catalog_render_type },
      { render_type: ButtonInterface.admin_render_type }
    ]);
    buttons.inline_keyboard.push(this.getBackWelcomeButton());

    return buttons;
  }

  async getButtonsForOrder() {
    const buttons = await this.getButtonByRendererType([
      { render_type: ButtonInterface.admin_render_type },
      { render_type: ButtonInterface.order_render_type }
    ]);

    buttons.inline_keyboard.push(this.getBackCatalogButton());

    return buttons;
  }

  async getButtonByRendererType(renderTypes = []) {
    const buttons = await this.prisma.buttonSettings.findMany({
      where: {
        OR: renderTypes
      },
      orderBy: {
        order: 'asc'
      }
    });

    const keyboard = [];
    let currentRow = [];

    // Get admin_path configuration once
    const adminPath = await configHelper.get('admin_path', '');

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      let buttonUrl = button.value;

      // For admin and order buttons with value "config", use the admin_path configuration
      if ((button.render_type === 'admin' || button.render_type === 'order') && button.value === 'config') {
        buttonUrl = adminPath || button.value;
      }

      // Add the order message for ALL order buttons (regardless of value)
      if (button.render_type === 'order') {
        buttonUrl += '?text=' + encodeURIComponent('Добрий день! Хочу зробити замовлення');
      }

      // For sales buttons, add coupon code if available
      if (button.render_type === 'sales' && button.value === 'config') {
        buttonUrl = adminPath || button.value;
      }

      const buttonConfig = {
        text: button.name,
        [button.type === 'url' ? 'url' : 'callback_data']: buttonUrl
      };

      // Add emoji based on button type
      if (button.type === 'url') {
        buttonConfig.text = '🔗 ' + buttonConfig.text;
      } else if (button.value === 'catalog') {
        buttonConfig.text = '📋 ' + buttonConfig.text;
      } else if (button.render_type === 'sales') {
        buttonConfig.text = '🎯 ' + buttonConfig.text;
      }

      // Add button to current row
      currentRow.push(buttonConfig);

      // If we have 2 buttons in the row or this is the last button, add the row to keyboard
      if (currentRow.length === 2 || i === buttons.length - 1) {
        keyboard.push(currentRow);
        currentRow = [];
      }
    }

    return { inline_keyboard: keyboard };
  }

  getBackCatalogButton() {
    return [{
      text: '⬅️ Назад',
      callback_data: 'catalog'
    }];
  }

  getBackWelcomeButton() {
    return [{
      text: '⬅️ Назад',
      callback_data: 'welcome'
    }];
  }

  // Get all buttons
  async getAllButtons() {
    return await this.prisma.buttonSettings.findMany({
      orderBy: { order: 'asc' }
    });
  }

  // Create a new button
  async createButton(data) {
    return await this.prisma.buttonSettings.create({
      data
    });
  }

  // Update a button
  async updateButton(id, data) {
    return await this.prisma.buttonSettings.update({
      where: { id },
      data
    });
  }

  // Delete a button
  async deleteButton(id) {
    return await this.prisma.buttonSettings.delete({
      where: { id }
    });
  }

  /**
   * Get sales buttons with optional coupon context
   * @param {string} couponCode - Optional coupon code to include in button URLs
   * @returns {Object} Keyboard configuration
   */
  async getSalesButtons(couponCode = null) {
    const buttons = await this.prisma.buttonSettings.findMany({
      where: {
        render_type: 'sales'
      },
      orderBy: {
        order: 'asc'
      }
    });

    const keyboard = [];
    let currentRow = [];

    // Get admin_path configuration once
    const configHelper = require('../configuration/config-helper');
    const adminPath = await configHelper.get('admin_path', '');

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      let buttonUrl = button.value;

      // For sales buttons with value "config", use the admin_path configuration
      if (button.value === 'config') {
        buttonUrl = adminPath || button.value;

        // Add coupon code to URL if provided
        if (couponCode) {
          buttonUrl += `?text=${encodeURIComponent(`Доброго дня, бажаю зробити замовлення з SalesCode:\n${couponCode}`)}`;
        }
      }

      const buttonConfig = {
        text: '🎯 ' + button.name,
        [button.type === 'url' ? 'url' : 'callback_data']: buttonUrl
      };

      // Add button to current row
      currentRow.push(buttonConfig);

      // If we have 2 buttons in the row or this is the last button, add the row to keyboard
      if (currentRow.length === 2 || i === buttons.length - 1) {
        keyboard.push(currentRow);
        currentRow = [];
      }
    }

    return { inline_keyboard: keyboard };
  }
}
module.exports = ButtonsService;