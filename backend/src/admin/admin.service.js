const { PrismaClient } = require('@prisma/client');

class AdminService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new admin
   * @param {Object} adminData - Admin data object
   * @param {string} adminData.user_name - Admin username
   * @returns {Promise<Object>} Created admin object
   */
  async createAdmin(adminData) {
    try {
      const admin = await this.prisma.admin.create({
        data: {
          user_name: adminData.user_name,
        }
      });
      return admin;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  /**
   * Get all admins
   * @returns {Promise<Array>} Array of all admins
   */
  async getAllAdmins() {
    try {
      const admins = await this.prisma.admin.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      return admins;
    } catch (error) {
      console.error('Error getting admins:', error);
      throw error;
    }
  }

  /**
   * Get admin by username
   * @param {string} username - Admin username
   * @returns {Promise<Object|null>} Admin object or null if not found
   */
  async getAdminByUsername(username) {
      const admin = await this.prisma.admin.findUnique({
        where: {
          user_name: username
        }
      });
      return admin;
  }

  /**
   * Delete admin by ID
   * @param {number} id - Admin ID
   * @returns {Promise<Object>} Deleted admin object
   */
  async deleteAdmin(id) {
    try {
      const admin = await this.prisma.admin.delete({
        where: {
          id: parseInt(id)
        }
      });
      return admin;
    } catch (error) {
      console.error('Error deleting admin:', error);
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

module.exports = AdminService; 