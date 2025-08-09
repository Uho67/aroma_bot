const { PrismaClient } = require('@prisma/client'); // Import PrismaClient
const ButtonInterface = require('./button.interface');

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
  
    buttons.forEach((button, index) => {
      const buttonConfig = {
        text: button.name,
        [button.type === 'url' ? 'url' : 'callback_data']: button.render_type === 'order' ? button.value + '?text=' + encodeURIComponent('Добрий день! Хочу зробити замовлення:') : button.value
      };
  
      // Add emoji based on button type
      if (button.type === 'url') {
        buttonConfig.text = '🔗 ' + buttonConfig.text;
      } else if (button.value === 'catalog') {
        buttonConfig.text = '📋 ' + buttonConfig.text;
      }
      
      // Add button to current row
      currentRow.push(buttonConfig);
      
      // If we have 2 buttons in the row or this is the last button, add the row to keyboard
      if (currentRow.length === 2 || index === buttons.length - 1) {
        keyboard.push(currentRow);
        currentRow = [];
      }
    });
  
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
}
module.exports = ButtonsService;