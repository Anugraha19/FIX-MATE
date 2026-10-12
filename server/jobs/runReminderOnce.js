// Run the reminder check once, by hand:  npm run reminders
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { runReminderCheck } = require('./reminderJob');
const { sequelize } = require('../models');

runReminderCheck()
  .then((count) => console.log(`Done. ${count} reminder(s) written to logs/reminders.log`))
  .catch((err) => console.error('Failed:', err.message))
  .finally(() => sequelize.close());
