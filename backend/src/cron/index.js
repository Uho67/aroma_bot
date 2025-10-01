const cron = require('node-cron');
const AttentionCheckerService = require('./attention-checker.service');
const QueueProcessorService = require('./queue-processor.service');
const PostQueueProcessorService = require('./post-queue-processor.service');

const attentionChecker = new AttentionCheckerService();
const queueProcessor = new QueueProcessorService();
const postQueueProcessor = new PostQueueProcessorService();

// Запускаем проверку каждый день в 9:00 утра (DISABLED: Feb 29 schedule)
const startAttentionCheckCron = () => {
  cron.schedule('0 9 29 2 *', async () => {
    console.log('Running daily attention check...');
    await attentionChecker.checkUsersAttention();
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow'
  });
  console.log('Attention check cron job DISABLED (Feb 29 schedule)');
};

// Запускаем обработку очереди купонов каждые 5 минут (DISABLED: Feb 29 schedule)
const startQueueProcessorCron = () => {
  cron.schedule('0 0 29 2 *', async () => {
    console.log('Running queue processor...');
    await queueProcessor.processQueue();
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow'
  });
  console.log('Queue processor cron job DISABLED (Feb 29 schedule)');
};

// Запускаем обработку очереди постов каждые 2 минуты (DISABLED: Feb 29 schedule)
const startPostQueueProcessorCron = () => {
  cron.schedule('0 0 29 2 *', async () => {
    console.log('Running post queue processor...');
    await postQueueProcessor.processPostQueue();
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow'
  });
  console.log('Post queue processor cron job DISABLED (Feb 29 schedule)');
};

// Запускаем все cron jobs
const startAllCrons = () => {
  startAttentionCheckCron();
  startQueueProcessorCron();
  startPostQueueProcessorCron();
};

module.exports = {
  startAllCrons,
  attentionChecker,
  queueProcessor,
  postQueueProcessor,
  // Экспортируем отдельные функции
  startAttentionCheckCron,
  startQueueProcessorCron,
  startPostQueueProcessorCron
};
