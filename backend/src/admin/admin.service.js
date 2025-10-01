const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

class AdminService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Hash password using SHA-256
   * @param {string} password - Plain text password
   * @returns {string} Hashed password
   */
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {boolean} True if password matches
   */
  verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  /**
   * Authenticate admin login
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise<Object|null>} Admin object if authenticated, null if not
   */
  async authenticateAdmin(username, password) {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { user_name: username }
      });

      if (!admin) {
        return null;
      }

      if (!this.verifyPassword(password, admin.password)) {
        return null;
      }

      // Return admin without password
      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    } catch (error) {
      console.error('Error authenticating admin:', error);
      return null;
    }
  }

  /**
   * Create a new admin
   * @param {Object} adminData - Admin data object
   * @param {string} adminData.user_name - Admin username
   * @param {string} adminData.password - Admin password
   * @returns {Promise<Object>} Created admin object
   */
  async createAdmin(adminData) {
    try {
      const hashedPassword = this.hashPassword(adminData.password);

      const admin = await this.prisma.admin.create({
        data: {
          user_name: adminData.user_name,
          password: hashedPassword
        }
      });

      // Return admin without password
      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
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