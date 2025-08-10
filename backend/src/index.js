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
const AdminBotService = require('./telegram/admin-bot.service');
const SalesRuleRouter = require('./sales-rule/sales-rule.router');
const CouponCodeRouter = require('./coupon-code/coupon-code.router');

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
const adminBotService = new AdminBotService();
const broadcastRouter = new BroadcastRouter(botService);
const salesRuleRouter = new SalesRuleRouter();
const couponCodeRouter = new CouponCodeRouter();



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
app.use('/api', salesRuleRouter.getRouter());
app.use('/api', couponCodeRouter.getRouter());

// Initialize bots on startup
async function initializeBotsOnStartup() {
  await botService.initializeBot();
  await adminBotService.initializeBot();
  // Set the global instances
  BotService.instance = botService;
  AdminBotService.instance = adminBotService;
}

// API Routes
// Get all users with pagination
app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where = {};

    // Search filter
    if (search.trim()) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { user_name: { contains: search } },
        { chat_id: { contains: search } }
      ];
    }

    // Status filter
    if (status === 'active') {
      where.is_blocked = false;
    } else if (status === 'blocked') {
      where.is_blocked = true;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};

      if (dateFrom) {
        // Start of day in UTC (matches database storage format)
        where.createdAt.gte = new Date(dateFrom + 'T00:00:00.000Z');
      }

      if (dateTo) {
        // End of day in UTC (matches database storage format)
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Last 5 messages per user
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
      }
    });
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





// Start server and initialize bots
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await initializeBotsOnStartup();
});