const { PrismaClient } = require('@prisma/client');

class UserService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new user and save to database
   * @param {Object} userData - User data object
   * @param {string} userData.chat_id - Telegram chat ID
   * @param {string} userData.user_name - Username (optional)
   * @param {string} userData.first_name - First name (optional)
   * @param {string} userData.last_name - Last name (optional)
   * @param {boolean} userData.is_blocked - Block status (default: false)
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      const user = await this.prisma.user.create({
        data: {
          chat_id: userData.chat_id,
          user_name: userData.user_name || null,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          is_blocked: userData.is_blocked || false,
        }
      });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get list of users who are not blocked
   * @returns {Promise<Array>} Array of non-blocked users
   */
  async getNonBlockedUsers() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          is_blocked: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return users;
    } catch (error) {
      console.error('Error getting non-blocked users:', error);
      throw error;
    }
  }

  /**
   * Get total count of all users
   * @returns {Promise<number>} Total user count
   */
  async getAllUsersCount() {
    try {
      const count = await this.prisma.user.count();
      return count;
    } catch (error) {
      console.error('Error getting all users count:', error);
      throw error;
    }
  }

  /**
   * Get count of users who are not blocked
   * @returns {Promise<number>} Count of non-blocked users
   */
  async getNonBlockedUsersCount() {
    try {
      const count = await this.prisma.user.count({
        where: {
          is_blocked: false
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting non-blocked users count:', error);
      throw error;
    }
  }

  /**
   * Get user by chat_id
   * @param {string} chatId - Telegram chat ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserByChatId(chatId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          chat_id: chatId
        }
      });
      return user;
    } catch (error) {
      console.error('Error getting user by chat_id:', error);
      throw error;
    }
  }

  /**
   * Update user's blocked status
   * @param {string} chatId - Telegram chat ID
   * @param {boolean} isBlocked - New blocked status
   * @returns {Promise<Object>} Updated user object
   */
  async updateUserBlockStatus(chatId, isBlocked) {
    try {
      const user = await this.prisma.user.update({
        where: {
          chat_id: chatId
        },
        data: {
          is_blocked: isBlocked
        }
      });
      return user;
    } catch (error) {
      console.error('Error updating user block status:', error);
      throw error;
    }
  }

  /**
   * Update user information
   * @param {string} chatId - Telegram chat ID
   * @param {Object} userData - User data to update
   * @param {string} userData.user_name - Username (optional)
   * @param {string} userData.first_name - First name (optional)
   * @param {string} userData.last_name - Last name (optional)
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(chatId, userData) {
    try {
      const user = await this.prisma.user.update({
        where: {
          chat_id: chatId
        },
        data: {
          user_name: userData.user_name || null,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
        }
      });
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Close Prisma connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = UserService; 