const cron = require('node-cron');
const AttentionCheckerService = require('./attention-checker.service');

const attentionChecker = new AttentionCheckerService();

// Запускаем проверку каждый день в 9:00 утра
const startAttentionCheckCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily attention check...');
    await attentionChecker.checkUsersAttention();
  }, {
    scheduled: true,
    timezone: "Europe/Moscow" // или другая подходящая временная зона
  });

  console.log('Attention check cron job scheduled for daily at 9:00 AM');
};

// Метод для ручного запуска (для тестирования)
const runManualCheck = async () => {
  console.log('Manual attention check requested...');
  await attentionChecker.manualCheck();
};

module.exports = {
  startAttentionCheckCron,
  runManualCheck,
  attentionChecker  // Добавляем экспорт attentionChecker
};
