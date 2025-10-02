const cron = require('node-cron');
const AttentionCheckerService = require('./attention-checker.service');
const QueueProcessorService = require('./queue-processor.service');
const PostQueueProcessorService = require('./post-queue-processor.service');
const BackupService = require('./backup.service');

const attentionChecker = new AttentionCheckerService();
const queueProcessor = new QueueProcessorService();
const postQueueProcessor = new PostQueueProcessorService();
const backupService = new BackupService();

// Запускаем проверку каждый день в 9:00 утра
const startAttentionCheckCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily attention check...');
    await attentionChecker.checkUsersAttention();
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow'
  });
  console.log('Attention check cron job scheduled for daily at 9:00 AM');
};

// Запускаем обработку очереди купонов каждые 5 минут
const startQueueProcessorCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running queue processor...');
    await queueProcessor.processQueue();
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow'
  });
  console.log('Queue processor cron job scheduled for every 5 minutes');
};

// Запускаем обработку очереди постов каждые 5 минут
const startPostQueueProcessorCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running post queue processor...');
    await postQueueProcessor.processPostQueue();
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow'
  });
  console.log('Post queue processor cron job scheduled for every 5 minutes');
};

// Запускаем создание бэкапа базы данных каждый день в 6:00 утра
const startBackupCron = () => {
  cron.schedule('0 6 * * *', async () => {
    console.log('Running daily database backup...');
    await backupService.runBackupProcess();
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow'
  });
  console.log('Database backup cron job scheduled for daily at 6:00 AM');
};

// Запускаем все cron jobs
const startAllCrons = () => {
  startAttentionCheckCron();
  startQueueProcessorCron();
  startPostQueueProcessorCron();
  startBackupCron();
};

module.exports = {
  startAllCrons,
  attentionChecker,
  queueProcessor,
  postQueueProcessor,
  backupService,
  // Экспортируем отдельные функции
  startAttentionCheckCron,
  startQueueProcessorCron,
  startPostQueueProcessorCron,
  startBackupCron
};
