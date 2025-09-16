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
const ConfigurationRouter = require('./configuration/configuration.router');
const SubscriptionRouter = require('./telegram/subscription.router');
const { startAllCrons, attentionChecker, queueProcessor, postQueueProcessor } = require('./cron');

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
const configurationRouter = new ConfigurationRouter();
const subscriptionRouter = new SubscriptionRouter();



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
app.use('/api', configurationRouter.getRouter());
app.use('/api', subscriptionRouter.getRouter());

// Initialize bots on startup
async function initializeBotsOnStartup() {
  await botService.initializeBot();
  await adminBotService.initializeBot();

  // Initialize subscription service with admin bot
  await subscriptionRouter.subscriptionService.initialize(adminBotService.getBot());

  // Set the global instances
  BotService.instance = botService;
  AdminBotService.instance = adminBotService;
}

// API Routes
// Get all users with pagination
app.get('/api/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
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

    // Subscription filter
    const subscription = req.query.subscription || '';
    if (subscription === 'subscribed') {
      where.is_subscriber = true;
    } else if (subscription === 'not_subscribed') {
      where.is_subscriber = false;
    }

    // Attention needed filter
    const attentionFilter = req.query.attentionFilter || '';
    if (attentionFilter === 'needs_attention') {
      where.attention_needed = true;
    } else if (attentionFilter === 'no_attention') {
      where.attention_needed = false;
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
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.000Z');
      }
    }

    // Updated date range filter
    const updatedFrom = req.query.updatedFrom;
    const updatedTo = req.query.updatedTo;
    if (updatedFrom || updatedTo) {
      where.updatedAt = {};

      if (updatedFrom) {
        // Start of day in UTC (matches database storage format)
        where.updatedAt.gte = new Date(updatedFrom + 'T00:00:00.000Z');
      }

      if (updatedTo) {
        // End of day in UTC (matches database storage format)
        where.updatedAt.lte = new Date(updatedTo + 'T23:59:59.000Z');
      }
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });

    // Get paginated users with sales rules
    const users = await prisma.user.findMany({
      where,
      include: {
        userSalesRules: {
          include: {
            salesRule: {
              select: {
                id: true,
                name: true
              }
            }
          }
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

// Check subscriptions for multiple users
app.post('/api/users/check-subscriptions', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    // Get users with their details
    const users = await prisma.user.findMany({
      where: {
        chat_id: { in: userIds }
      },
      select: {
        chat_id: true,
        first_name: true,
        last_name: true,
        user_name: true
      }
    });

    // Check subscriptions using the subscription service
    const subscriptionResults = await subscriptionRouter.subscriptionService.checkMultipleSubscriptions(
      users.map(user => user.chat_id)
    );

    // Organize results
    const subscribed = [];
    const notSubscribed = [];
    let channelInfo = null;

    for (let i = 0; i < subscriptionResults.length; i++) {
      const result = subscriptionResults[i];
      const user = users.find(u => u.chat_id === result.chatId);

      if (result.isSubscribed) {
        subscribed.push({
          chatId: result.chatId,
          firstName: user?.first_name || '',
          lastName: user?.last_name || '',
          userName: user?.user_name || '',
          status: result.status
        });
      } else {
        notSubscribed.push({
          chatId: result.chatId,
          firstName: user?.first_name || '',
          lastName: user?.last_name || '',
          userName: user?.user_name || '',
          error: result.error
        });
      }

      // Get channel info from first successful result
      if (!channelInfo && result.channelTitle) {
        channelInfo = {
          title: result.channelTitle,
          username: result.channelUsername
        };
      }
    }

    res.json({
      subscribed,
      notSubscribed,
      channelInfo,
      total: userIds.length
    });

  } catch (error) {
    console.error('Error checking subscriptions:', error);
    res.status(500).json({ error: 'Failed to check subscriptions' });
  }
});

// Update user's sales rules
app.put('/api/users/:chatId/sales-rules', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { sales_rules } = req.body;

    if (sales_rules === undefined) {
      return res.status(400).json({ error: 'sales_rules field is required' });
    }

    // Get user first
    const user = await prisma.user.findUnique({
      where: { chat_id: chatId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete existing relations
    await prisma.userSalesRule.deleteMany({
      where: { user_id: user.id }
    });

    // Create new relations if sales_rules provided
    if (sales_rules && sales_rules.trim()) {
      const ruleIds = sales_rules.split(',').filter(id => id.trim());

      for (const ruleId of ruleIds) {
        try {
          await prisma.userSalesRule.create({
            data: {
              user_id: user.id,
              sales_rule_id: parseInt(ruleId.trim())
            }
          });
        } catch (error) {
          console.warn(`Failed to create relation for rule ${ruleId}:`, error);
        }
      }
    }

    // Update user's updatedAt
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user sales rules:', error);
    res.status(500).json({ error: 'Failed to update user sales rules' });
  }
});

// Check subscription for a single user
app.post('/api/users/:chatId/check-subscription', async (req, res) => {
  try {
    const { chatId } = req.params;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { chat_id: chatId },
      select: {
        chat_id: true,
        first_name: true,
        last_name: true,
        user_name: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check subscription using the subscription service
    const result = await subscriptionRouter.subscriptionService.checkSubscription(chatId);

    // Organize result
    if (result.isSubscribed) {
      res.json({
        subscribed: [{
          chatId: result.chatId || chatId,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          userName: user.user_name || '',
          status: result.status
        }],
        notSubscribed: [],
        channelInfo: result.channelTitle ? {
          title: result.channelTitle,
          username: result.channelUsername
        } : null,
        total: 1
      });
    } else {
      res.json({
        subscribed: [],
        notSubscribed: [{
          chatId: result.chatId || chatId,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          userName: user.user_name || '',
          error: result.error
        }],
        channelInfo: result.channelTitle ? {
          title: result.channelTitle,
          username: result.channelUsername
        } : null,
        total: 1
      });
    }

  } catch (error) {
    console.error('Error checking single subscription:', error);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

// Delete user
app.delete('/api/users/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { chat_id: chatId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user and all related data
    await prisma.$transaction(async (tx) => {
      // Delete user sales rules
      await tx.userSalesRule.deleteMany({
        where: { user_id: user.id }
      });

      // Delete coupon codes (using chat_id, not user_id)
      await tx.couponCode.deleteMany({
        where: { chat_id: user.chat_id }
      });

      // Delete from post queue
      await tx.postQueue.deleteMany({
        where: { user_id: user.id }
      });

      // Delete from sales rule queue
      await tx.userSalesRuleQueue.deleteMany({
        where: { user_id: user.id }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    res.json({
      success: true,
      message: `User ${chatId} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Mass delete users
app.delete('/api/users', async (req, res) => {
  try {
    const { chatIds } = req.body;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ error: 'chatIds array is required' });
    }

    // Get all users that exist
    const users = await prisma.user.findMany({
      where: { chat_id: { in: chatIds } }
    });

    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    const userIds = users.map(user => user.id);
    const userChatIds = users.map(user => user.chat_id);

    // Delete all users and their related data
    await prisma.$transaction(async (tx) => {
      // Delete user sales rules
      await tx.userSalesRule.deleteMany({
        where: { user_id: { in: userIds } }
      });

      // Delete coupon codes (using chat_id, not user_id)
      await tx.couponCode.deleteMany({
        where: { chat_id: { in: userChatIds } }
      });

      // Delete from post queue
      await tx.postQueue.deleteMany({
        where: { user_id: { in: userIds } }
      });

      // Delete from sales rule queue
      await tx.userSalesRuleQueue.deleteMany({
        where: { user_id: { in: userIds } }
      });

      // Finally delete all users
      await tx.user.deleteMany({
        where: { id: { in: userIds } }
      });
    });

    res.json({
      success: true,
      message: `Successfully deleted ${users.length} users`,
      deletedCount: users.length,
      requestedCount: chatIds.length,
      notFoundCount: chatIds.length - users.length
    });

  } catch (error) {
    console.error('Error mass deleting users:', error);
    res.status(500).json({ error: 'Failed to delete users' });
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

// Endpoint для отправки sales rules пользователям
app.post('/api/sales-rules/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Получаем sales rule
    const salesRule = await prisma.salesRule.findUnique({
      where: { id: parseInt(id) }
    });

    if (!salesRule) {
      return res.status(404).json({ error: 'Sales rule not found' });
    }

    // Отправляем sales rule пользователям через sales rule service
    const response = await salesRuleRouter.sendSalesRule(id, userIds);

    // После успешной отправки sales rule сбрасываем attention_needed для всех пользователей
    if (response.success) {
      try {
        await attentionChecker.resetUserAttentionByChatIds(userIds);
        console.log(`Reset attention_needed for ${userIds.length} users after sending sales rule`);
      } catch (resetError) {
        console.error('Error resetting attention_needed after sales rule:', resetError);
        // Не блокируем основной ответ из-за ошибки сброса attention_needed
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error in sales rule send:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Start server and initialize bots
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

  // Start cron jobs
  startAllCrons();

  await initializeBotsOnStartup();
});

// Cron endpoints
app.post('/api/cron/queue-process', async (req, res) => {
  try {
    const result = await queueProcessor.processQueue();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error running queue process:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cron/post-queue-process', async (req, res) => {
  try {
    const result = await postQueueProcessor.processPostQueue();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error running post queue process:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cron/attention-check', async (req, res) => {
  try {
    const result = await attentionChecker.checkUsersAttention();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error running attention check:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cron/queue-stats', async (req, res) => {
  try {
    const stats = await queueProcessor.getQueueStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cron/post-queue-stats', async (req, res) => {
  try {
    const stats = await postQueueProcessor.getQueueStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting post queue stats:', error);
    res.status(500).json({ error: error.message });
  }
});