const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

class BroadcastService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all non-blocked users
   * @returns {Promise<Array>} Array of non-blocked users
   */
  async getNonBlockedUsers() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          is_blocked: false
        }
      });
      return users;
    } catch (error) {
      console.error('Error getting non-blocked users:', error);
      throw error;
    }
  }

  /**
   * Get post by ID
   * @param {number} postId - Post ID
   * @returns {Promise<Object|null>} Post object or null if not found
   */
  async getPostById(postId) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: parseInt(postId) }
      });
      return post;
    } catch (error) {
      console.error('Error getting post by ID:', error);
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

module.exports = BroadcastService; 