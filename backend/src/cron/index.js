const cron = require('node-cron');
const AttentionCheckerService = require('./attention-checker.service');
const QueueProcessorService = require('./queue-processor.service');

const attentionChecker = new AttentionCheckerService();
const queueProcessor = new QueueProcessorService();

// Запускаем проверку каждый день в 9:00 утра
const startAttentionCheckCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily attention check...');
    await attentionChecker.checkUsersAttention();
  }, {
    scheduled: true,
    timezone: "Europe/Moscow"
  });

  console.log('Attention check cron job scheduled for daily at 9:00 AM');
};

// Запускаем обработку очереди каждые 5 минут
const startQueueProcessorCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running queue processor...');
    await queueProcessor.processQueue();
  }, {
    scheduled: true,
    timezone: "Europe/Moscow"
  });

  console.log('Queue processor cron job scheduled for every 5 minutes');
};

// Метод для ручного запуска проверки внимания
const runManualCheck = async () => {
  console.log('Manual attention check requested...');
  await attentionChecker.manualCheck();
};

// Метод для ручного запуска обработки очереди
const runManualQueueProcess = async () => {
  console.log('Manual queue processing requested...');
  await queueProcessor.manualProcess();
};

module.exports = {
  startAttentionCheckCron,
  startQueueProcessorCron,
  runManualCheck,
  runManualQueueProcess,
  attentionChecker,
  queueProcessor
};
