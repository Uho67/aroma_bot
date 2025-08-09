const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PostService = require('./post.service');

class PostRouter {
  constructor() {
    this.router = express.Router();
    this.postService = new PostService();
    this.setupMulter();
    this.setupRoutes();
  }

  setupMulter() {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // Configure multer for file uploads
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadsDir);
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
      }
    });

    this.upload = multer({ storage: storage });
  }

  setupRoutes() {
    // Get all posts
    this.router.get('/posts', async (req, res) => {
      try {
        const posts = await this.postService.getAllPosts();
        res.json(posts);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create new post with image upload
    this.router.post('/posts', this.upload.single('image'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No image file provided' });
        }

        const { description, link_to_button } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        const post = await this.postService.createPost({
          image: imageUrl,
          description, 
          link_to_button
        });

        res.json(post);
      } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Delete post
    this.router.delete('/posts/:id', async (req, res) => {
      try {
        const { id } = req.params;
        await this.postService.deletePost(id);
        res.json({ message: 'Post deleted successfully' });
      } catch (error) {
        if (error.message === 'Post not found') {
          res.status(404).json({ error: 'Post not found' });
        } else {
          res.status(500).json({ error: error.message });
        }
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = PostRouter; 