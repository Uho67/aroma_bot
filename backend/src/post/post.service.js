const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

class PostService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all posts ordered by creation date
   * @returns {Promise<Array>} Array of posts
   */
  async getAllPosts() {
    try {
      const posts = await this.prisma.post.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      return posts;
    } catch (error) {
      console.error('Error getting all posts:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data object
   * @param {string} postData.image - Image URL
   * @param {string} postData.description - Post description
   * @param {string} postData.link_to_button - Link to button
   * @returns {Promise<Object>} Created post object
   */
  async createPost(postData) {
    try {
      const post = await this.prisma.post.create({
        data: postData
      });
      return post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Get post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Object|null>} Post object or null if not found
   */
  async getPostById(id) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: parseInt(id) }
      });
      return post;
    } catch (error) {
      console.error('Error getting post by ID:', error);
      throw error;
    }
  }

  /**
   * Delete post by ID and its associated image file
   * @param {number} id - Post ID
   * @returns {Promise<Object>} Deleted post object
   */
  async deletePost(id) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: parseInt(id) }
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Delete the image file
      const imagePath = path.join(__dirname, '..', post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Delete the post from database
      const deletedPost = await this.prisma.post.delete({
        where: { id: parseInt(id) }
      });

      return deletedPost;
    } catch (error) {
      console.error('Error deleting post:', error);
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

module.exports = PostService; 