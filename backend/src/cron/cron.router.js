const express = require('express');
const { attentionChecker, queueProcessor, postQueueProcessor } = require('./index');

class CronRouter {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Статистика очереди купонов
    this.router.get('/queue-stats', async (req, res) => {
      try {
        const stats = await queueProcessor.getQueueStats();
        res.json(stats);
      } catch (error) {
        console.error('Error getting queue stats:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Статистика очереди постов
    this.router.get('/post-queue-stats', async (req, res) => {
      try {
        const stats = await postQueueProcessor.getPostQueueStats();
        res.json(stats);
      } catch (error) {
        console.error('Error getting post queue stats:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Время последней проверки внимания
    this.router.get('/last-attention-check', async (req, res) => {
      try {
        const lastCheck = await attentionChecker.getLastCheckTime();
        res.json({ lastCheck });
      } catch (error) {
        console.error('Error getting last attention check:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Запуск обработки очереди купонов
    this.router.post('/run-queue-process', async (req, res) => {
      try {
        const result = await queueProcessor.processQueue();
        res.json({ success: true, result });
      } catch (error) {
        console.error('Error running queue process:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Запуск обработки очереди постов
    this.router.post('/run-post-queue-process', async (req, res) => {
      try {
        const result = await postQueueProcessor.processPostQueue();
        res.json({ success: true, result });
      } catch (error) {
        console.error('Error running post queue process:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Запуск проверки внимания
    this.router.post('/run-attention-check', async (req, res) => {
      try {
        const result = await attentionChecker.checkUsersAttention();
        res.json({ success: true, result });
      } catch (error) {
        console.error('Error running attention check:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }
}

module.exports = CronRouter;
