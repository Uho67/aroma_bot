require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const ButtonsService = require('./telegram/buttons.services');
const UserService = require('./user/user.service');
const AdminRouter = require('./admin/admin.router');
const ButtonRouter = require('./telegram/button.router');
const PostRouter = require('./post/post.router');
const UploadRouter = require('./upload/upload.router');
const BroadcastRouter = require('./broadcast/broadcast.router');
const BotService = require('./telegram/bot.service');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

// Create instances of services
const buttonsService = new ButtonsService();
const userService = new UserService();
const adminRouter = new AdminRouter();
const buttonRouter = new ButtonRouter();
const postRouter = new PostRouter();
const uploadRouter = new UploadRouter();
const botService = new BotService();
const broadcastRouter = new BroadcastRouter(botService);



// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add CORS headers for static files
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
});

// Use routers
app.use('/api', adminRouter.getRouter());
app.use('/api', buttonRouter.getRouter());
app.use('/api', postRouter.getRouter());
app.use('/api', uploadRouter.getRouter());
app.use('/api', broadcastRouter.getRouter());

// Initialize bot on startup
async function initializeBotOnStartup() {
  await botService.initializeBot();
}

// API Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { messages: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      include: { user: true }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get start message settings
app.get('/api/start-message', async (req, res) => {
  try {
    const settings = await prisma.startMessageSettings.findFirst({
      where: { id: 1 }
    });

    if (!settings) {
      // If no settings exist, create default settings
      const defaultSettings = await prisma.startMessageSettings.create({
        data: {
          id: 1,
          text: 'Добро пожаловать! Выберите действие:',
          image: null
        }
      });
      return res.json(defaultSettings);
    }

    res.json(settings);
  } catch (error) {
    console.error('Error getting start message settings:', error);
    res.status(500).json({ error: 'Failed to get start message settings' });
  }
});

// Update start message settings
app.put('/api/start-message', async (req, res) => {
  try {
    const { text, image } = req.body;
    const settings = await prisma.startMessageSettings.upsert({
      where: { id: 1 },
      update: { text, image },
      create: { id: 1, text, image }
    });
    res.json(settings);
  } catch (error) {
    console.error('Error updating start message settings:', error);
    res.status(500).json({ error: 'Failed to update start message settings' });
  }
});





// Start server and initialize bot
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await initializeBotOnStartup();
});