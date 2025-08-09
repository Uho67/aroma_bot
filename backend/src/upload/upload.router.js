const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class UploadRouter {
  constructor() {
    this.router = express.Router();
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
    // Upload image for start message
    this.router.post('/upload', this.upload.single('image'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No image file provided' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
      } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = UploadRouter; 